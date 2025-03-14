export function createApp(options={}) {
    const defaults = {
        name: "app",
        renderers: {
            container: function(section) {
                const holder = document.createElement("section");
                this.render(section.content).then(nodes => holder.append(...nodes));
                return holder;
            },
            header: function(section) {
                const header = document.createElement(`h${section.level}`);
                header.textContent = section.text;
                return header;
            },
            paragraph: function(section) {
                const p = document.createElement("p");

                if (section.content) {
                    section.content.forEach(s => this.render(s).then(node => p.appendChild(node)));
                } else if (section.formats) {
                    const formats = section.formats.split(section.separator);
                    const texts = section.text.split(section.separator);
    
                    for(let i=0;i<formats.length;i++) {
                        let temp;
                        switch (formats[i]) {
                            default:
                                temp = document.createTextNode(texts[i]);
                                break;
                            case "b":
                                temp = document.createElement("strong");
                                temp.innerText = texts[i];
                                break;
                            case "i":
                                temp = document.createElement("em");
                                temp.innerText = texts[i];
                                break;
                        }
                        p.appendChild(temp);
                    }
                } else {
                    p.innerText = section.text;
                }
                return p; 
            },
            link: function(section) {
                let a = document.createElement("a");
                a.setAttribute("href", section.link);
                a.textContent = section.text? section.text: section.link;
                return a;
            },
            list: function(section) {
                let tag = section.subtype == "bullets"? "ul": "ol";
                let list = document.createElement(tag);
                section.items.forEach(i => {
                    item = list.appendChild(document.createElement("li"));
                    this.render(i).then(node => item.appendChild(node));
                });
                return list;
            }
        },
        extensions: {},
        contentHolder: "#app-content",
        titleHolder: "#app-title",
        load: function() {
            return Promise.resolve({ title: "Sample App Page", content: [{type: "paragraph", text: "You're using the default loader! Provide your own content loader, either by specifying one in the factory method, or setting the 'loader' property."}]})
        },
        defaultPath: "#home",
        embed: false,
        autostart: false
    }

    // merge default renders into options if specified; otherwise we'll overwrite the defaults below.
    // we need to do this by merging on defaults then reassigning to options in case options overrides any default renderer.
    if (options.renderers) options.renderers = Object.assign(defaults.renderers, options.renderers);

    // merge defaults and incoming options into single settings object
    let settings = Object.assign({}, defaults, options);

    if (!settings.store) settings.store = {};

    settings.listeners = {
        "preload": [],
        "prerender": [],
        "postrender": []
    }

    function addEvent(name, fn) {
        if (!(name in settings.listeners)) {
            settings.listeners[name] = [];
        }
        
        if (!settings.listeners[name].includes(fn)) settings.listeners[name].push(fn);
        
        return this;
    }

    function delEvent(name, fn) {
        if (settings.listeners[name].includes(fn)) {
            let list = settings.listeners[name];
            let loc = list.indexOf(fn);
            settings.listeners[name] = list.slice(0,loc).concat(list.slice(loc+1))
        }
    }

    function dispatchEvent(name, ...args) {
        settings.listeners[name].forEach(l => l.call(this, ...args))
    }

    if (!(settings.contentHolder instanceof HTMLElement)) settings.contentHolder = document.querySelector(settings.contentHolder);
    if (!(settings.titleHolder instanceof HTMLElement)) settings.titleHolder = document.querySelector(settings.titleHolder);
    
    if (!document.querySelector("title")) document.head.appendChild(document.createElement("title"));

    function render(content) {
        if (Array.isArray(content)) {
            // if we are passed an array of content, we return an array of nodes which will be rendered in order correctly.
            return Promise.allSettled(content.map(c => this.render(c))).then(promises => promises.map(p => p.value))
        }

        let renderer = settings.renderers[content.type];
        let rendered = null;

        if (renderer) { 
            try {
                rendered = renderer.call(this, content); 
            } catch (e) {
                console.log(e);
                rendered = document.createElement("p");
                rendered.innerHTML = `It was not possible to render this <code>${content.type}</code> block.`;
            }
        } 
        else if (content instanceof String) { rendered = document.createTextNode(` ${content} `); } 
        else if (content instanceof Object) { console.error("Attempt to render unrecognised content section:", content); }
        else { rendered = document.createTextNode(` ${content} `); }

        if (rendered instanceof Promise) return rendered
        else return Promise.resolve(rendered);
    }

    function navigateTo(path) {
        if (settings.history) {
            settings.history.unshift(path);
            window.scroll(0,0);
            this.load();
        } else {
            window.location.hash = path;
        }
    }

    function refresh() {
        if (settings.history) {
            if (!settings.history[0]) settings.history.push(settings.defaultPath);
            settings.path = settings.history[0];
        } else {
            settings.path = location.hash && location.hash.length > 1? location.hash: settings.defaultPath;
        }

        dispatchEvent.call(this, "preload");

        settings.load.call(this, settings.path).then(page => {
            settings.titleHolder.textContent = page.title;
            document.querySelector("title").textContent = page.title? page.title: settings.name;

            dispatchEvent.call(this, "prerender", page);
            
            while (settings.contentHolder.firstChild) settings.contentHolder.removeChild(settings.contentHolder.lastChild);
            Promise.allSettled(page.content.map(c => this.render(c))).then(promises => promises.map(p => p.value)).then(nodes => settings.contentHolder.append(...nodes))
            .then(() => dispatchEvent.call(this, "postrender"));
        })
    }

    function store(key, value=undefined) {
        if (value === undefined) return settings.store[key];

        if (value === null && key in settings.store) { delete settings.store[key]; }
        else { settings.store[key] = value; }
         
        return;
    }

    const app = {
        addRenderer: function(name, fn) { settings.renderers[name] = fn; },
        addExtension: function(name, fn) { Object.defineProperty(this, name, { value: function(...args) {
            return fn.call(this, ...args);
        }})},

        render: function(section) { return render.call(this, section) },

        set loader(fn) { settings.load = fn; },

        // general properties
        get name() { return settings.name; }, set name(v) { settings.name = v; },
        get path() { return settings.path; }, set path(v) { navigateTo.call(this, v) },
        get contentHolder() { return settings.contentHolder; }, set contentHolder(v) { if (v instanceof HTMLElement) { settings.contentHolder = v } else { settings.contentHolder = document.querySelector(v) } },
        get titleHolder() { return settings.titleHolder }, set titleHolder(v) { if (v instanceof HTMLElement) { settings.titleHolder = v } else { settings.titleHolder = document.querySelector(v) } },

        get defaultPath() { return settings.defaultPath; }, set defaultPath(v) { settings.defaultPath = v; },

        load: function() { refresh.call(this)},

        store: {
            set: function(k,v) { store.call(this, k, v) },
            get: function(k) { return store.call(this, k) }
        },

        addEventListener: function(name, fn) { return addEvent.call(this, name, fn); },
        removeEventListener: function(name, fn) { return delEvent.call(this, name, fn); },
        dispatchEvent: function(name, ...args) { return dispatchEvent.call(this, name, ...args); }
    }

    function init() {
        // set up link handling
        if (settings.embed) {
            // if the app's embedded we can't use fragments in the location
            // so we intercept fragment links and add them to an app history:
            settings.history = [];

            // we could do something with local storage here to remember the app
            // history between visits? not sure how useful that would be.
            
            document.addEventListener("click", e => {
                let src = e.target;
                
                while (src.tagName != "A" && src.parentNode) src = src.parentNode;
                if (src.tagName != "A") return true;
                let path = src.getAttribute("href");
                if (path.charAt(0) != '#') return true;
    
                e.preventDefault(); e.stopPropagation();
                // handle a click on a fragment <a>
                settings.history.unshift(path);
                window.scroll(0,0);
                this.load();
            })
        } else { 
            // not embeded so we can allow fragment links to perform their default action
            // and listen for the ensuing popstate events:
            window.addEventListener("popstate", pse => {
                window.scroll(0,0);
                this.load();
            })
        }
    }
    
    init.call(app)

    Object.keys(settings.extensions).forEach(k => app.addExtension(k, settings.extensions[k]));


    // either autostart the app or add a start property (which actually just duplicates the load() function)
    // now we've added path setting (which also loads the app) this gives consumers of the app more flexibility
    if (settings.autostart) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', app.load)
        } else {
            app.load();
        }
    } else {
        Object.defineProperty(app, "start", { value: app.load });
    }

    return app;
}