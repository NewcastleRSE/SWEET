export async function goalCheckerRenderer(section) {
    let goals = await fetch(`/myapp/mygoals/${section.goaltype}`).then(response => response.json());

    if (goals.current.length == 0 && goals.complete.length == 0) {
        // handle user not having completed this type of goal.
        let schema = await fetch(`/app/schemas/goals/${section.goaltype}`).then(response => response.json())
        let holder = document.createElement("section");
        holder.innerHTML = `<p>It looks like you haven't set any goals in the ${schema.displayName} section yet. To go to the ${schema.displayName} section click the button below.</p>`
        holder.appendChild(await this.render({ type: "menu", content: [{ type: "menu-item", title: `Go to the ${schema.displayName} section`, link: `#home/healthy-living/${section.goaltype == "eating"? "heathly-eating": "being-active"}`}]}))
        return holder;
    } else {
        return await this.render({type: "goalsetter", goaltype: section.goaltype})
    }
}