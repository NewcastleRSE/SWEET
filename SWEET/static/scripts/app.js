export function createApp(options={}) {
    const defaults = {
        name: "app",
        renderers: {
            container: function(section) {
                const holder = document.createElement("section");
                section.content.forEach(item => holder.appendChild(this.render(item)));
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
                    section.content.forEach(s => p.appendChild(this.render(s)));
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
                    item.appendChild(render(i));
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

    if (!(settings.contentHolder instanceof HTMLElement)) settings.contentHolder = document.querySelector(settings.contentHolder);
    if (!(settings.titleHolder instanceof HTMLElement)) settings.titleHolder = document.querySelector(settings.titleHolder);
    
    if (!document.querySelector("title")) document.head.appendChild(document.createElement(title));
  
    function render(content) {
        let renderer = settings.renderers[content.type];

        // if we've found a renderer we call it
        if (renderer) return renderer.call(this, content);
        
        if (content instanceof String) return document.createTextNode(` ${content} `);
        
        if (content instanceof Object) {
            console.error("Attempt to render unrecognised content section:", content);
            return document.createTextNode("");
        }

        // non-String non-Object contents must be some kind of literal(?): 
        return document.createTextNode(` ${content} `);
    }

    function refresh() {
        let path;

        if (settings.history) {
            if (!settings.history[0]) settings.history.push(settings.defaultPath);
            path = settings.history(0);
        } else {
            path = location.hash && location.hash.length > 1? location.hash: settings.defaultPath;
        }

        settings.load(path).then(page => {
            settings.titleHolder.texContent = page.title;
            document.querySelector("title").textContent = page.title? page.title: settings.name;

            while (settings.contentHolder.firstChild) settings.contentHolder.removeChild(settings.contentHolder.lastChild);
            page.content.forEach(c => settings.contentHolder.appendChild(this.render(c)));
        })
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

        get contentHolder() { return settings.contentHolder; }, set contentHolder(v) { if (v instanceof HTMLElement) { settings.contentHolder = v } else { settings.contentHolder = document.querySelector(v) } },
        get titleHolder() { return settings.titleHolder }, set titleHolder(v) { if (v instanceof HTMLElement) { settings.titleHolder = v } else { settings.titleHolder = document.querySelector(v) } },

        get defaultPath() { return settings.defaultPath; }, set defaultPath(v) { settings.defaultPath = v; },

        load: function() { refresh.call(this)}
    }

    Object.defineProperty(app, "start", { value: (function() {
        let start = () => {
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
            // load the app content (the load function automatically handles opening the default page)
            this.load();
        }

        if (settings.autostart) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', start.bind(this));
            } else { 
                start.call(this);
            }

            return null;
        } else {
            return start.bind(this);
        }
    }).call(app)
})

    Object.keys(settings.extensions).forEach(k => app.addExtension(k, settings.extensions[k]));

    return app;
}