export class GoalSetter extends HTMLElement {
    static get contentType() { return "goalsetter"; }
    static get tagName() { return "goal-setter"; }
    static get description() { return "Goal Setter"; }

    constructor() {
        super();
        this.$ = {};
        const root = this.$.root = this.attachShadow({mode: "open"});
        root.innerHTML = `
        <label>Type of Goal:</label><select name="type"><option>activity</option></select>
        `
    }

    get isContainer() { return true }

    load(content) {
        this.$.root.querySelector("select").value = content.goaltype;
    }

    get jsonvalue() {
        return {
            type: this.constructor.contentType,
            goaltype: this.$.root.querySelector("select").value
        }
    }



}