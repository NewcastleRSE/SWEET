import { createModal } from './extensions/modal.js'

const post = function(url, data) {
    return fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
}

const renderers = {
    home: function() {
      return document.createElement("section");
    },
    users: function() {
        var holder = document.createElement("section");
        holder.innerHTML = `
        <div hidden>
          <label>Click this button to add a new participant to the study:</label><button type="button" id="add-participant" class="btn btn-primary">Add Participant</button><br>
          <label>Click this button to add a new collaborator to the study:</label><button type="button" id="add-colab" class="btn btn-primary">Add Collaborator</button>
        </div>
        <div><table id="user-list"></table></div>
        `
        var table = holder.querySelector("#user-list")
    
        fetch("/admin/data/allusers").then(response => response.json()).then(data => data.users)
        .then(users => {
          users.forEach(u => {
            console.log(users)
            let tr = document.createElement("tr");
            tr.dataset.userID = u.userID
            tr.innerHTML = `<th>${u.firstName} ${u.lastName}</th><td>${u.email}</td><td><button class="edit">Edit</button><button class="reset">Reset Data</button><button class="delete">Deactivate</button></td>`
            table.appendChild(tr)
          })
        })
    
        table.addEventListener("click", e => {
          let getUserId = function() {
            let src = e.target;
            while (src.tagName != "TR" && src.parentNode) src = src.parentNode;
    
            if (src.tagName != "TR" || !src.dataset.userID) {
              console.log("failed to find parent node with userID; aborting");
              return false;
            }
    
            return src.dataset.userID;
          }
    
          if (e.target.matches("button.reset, button.reset *")) {
            let user = getUserId();
            if (user && confirm("Reset all entered data for this user?")) {
    
              post("/admin/data/reset", { UserID: src.dataset.userID}).then(response => {
                if (response.ok) alert("User data successfully reset")
                else {
                  console.log(response); alert("An error occurred, check the console for full details");
                }
              })
            }
          } else if (e.target.matches("button.edit, button.edit *")) { 
            let userid = getUserId();
            if (userid) {
              fetch(`/admin/data/users/${userid}`).then(response => response.json())
              .then(user => {
                let modal = createModal(true);
    
                modal.title.textContent = `Edit user ${user.firstName} ${user.lastName}`;
                modal.body.innerHTML = `
                  <h4>User Details:</h4>
                  <form id="edit-user-form">
                    <label>User Name:</label><input type="text" name="firstName" value="${user.firstName}"> <input type="text" name="lastName" value="${user.lastName}"><br>
                    <label>User Email:</label><input type="email" name="email" value="${user.email}"><br>
                    <label>User Mobile:</label><input type="tel" name="mobile" value="${user.mobile || ""}"<br><br>
                    <label>User Role:</label><select name="role">
                      <option value="sysadmin">System Adminstrator</option>
                      <option value="studyadmin">Study Administrator</option>
                      <option value="editor">Content Manager</option>
                      <option value="staff">Research Team Member</option>
                      <option value="user">Standard User</option>
                    </select>
                  </form>
                `
    
                modal.footer.innerHTML = "<button type='button' class='btn btn-secondary'>Cancel</button> <button type='submit' form='edit-user-form' class='btn btn-primary'>Save Details</button>"
    
                let adminroles = ["sysadmin", "studyadmin", "editor", "staff", "user"];
                let myrole = adminroles.indexOf("{{g.user['role']}}")
                if (adminroles.indexOf(user.role) < myrole) {
                  modal.body.querySelector("select").setAttribute("disabled", "");
                } else {
                  adminroles.forEach((role, i) => {
                    if (i < myrole) {
                      modal.body.querySelector(`option[value='${role}']`).remove();
                    }
                  })
                }
    
                modal.body.querySelector("select").value = user.role;
    
                modal.body.querySelector("form").addEventListener("submit", e => {
                  e.preventDefault();
    
                  let updates =  {}
                  new FormData(e.target).forEach((value, name) => {
                    updates[name] = value;
                  })
    
                  post(`/admin/data/users/${user.userID}`, updates).then(response => response.json())
                  .then(result => {
                    // handle the result
    
                    // close the modal
                    modal.hide();
                  })
                })
    
                modal.footer.querySelector("button[type='button']").addEventListener("click", e => {
                  modal.hide();
                })
              
                modal.show();
              })
            }
          } else if (e.target.matches("button.delete, button.delete *")) {
            let userid = getUserId();
            if (userid && confirm("Deactivate this user?")) {
    
              post(`/admin/data/users/${userid}`, { deactivated: true }).then(response => {
                if (response.ok) alert("User successfully deactivated")
                else {
                  console.log(response); alert("An error occurred, check the console for full details");
                }
              })
            }
          } else {
            alert("This action is not currently implemented.")
          }
        })
    
        holder.querySelector("#add-participant").addEventListener("click", e => {
          let modal = createModal(true);
    
          modal.title.textContent = "Add a new participant to the study";
          modal.body.innerHTML = `
            <form id="modal-new-ppt-form">
              <label for="studyid">Participant's Study ID:</label> <input type="text" name="studyid" id="studyid"> <br>
              <label for="email">Participant's email address:</label> <input type="email" name="email" id="email"> <br>
              <label for="firstName">Participant's First Name:</label> <input type="text" name="firstName" id="firstName"> <br>
              <label for="lastName">Participant's Last Name:</label> <input type="text" name="lastName" id="lastName"> <br>
            </form>
          `
          modal.footer.innerHTML = `<button type="button" name="close" class="btn btn-secondary">Cancel</button> <button type="submit" for="modal-new-ppt-form" class="btn btn-primary">Create Participant</button>`
    
          modal.footer.querySelector("button[name='close']").addEventListener("click", () => {
            modal.hide();
          })
    
          modal.body.querySelector("form").addEventListener("submit", se => {
            se.preventDefault(); se.stopPropagation();
            let form = se.target;
    
            let user = {
              userID: form.elements["studyid"],
              email: form.elements["email"],
              firstName: form.eleements["firstName"],
              lastName: form.elements["lastName"],
              role: "participant"
            }
    
            post("/admin/data/createuser/", user).then(
              response => { alert("User created successfully"); modal.hide(); },
              reject => { alert(reject); modal.hide(); }
            )
          })
    
          modal.show();
        })
    
        holder.querySelector("#add-colab").addEventListener("click", e => {
          let modal = createModal(true);
    
          modal.title.textContent = "Add a new collaborator to the study";
          modal.body.innerHTML = `
            <form id="modal-new-colab-form">
              <label for="email">Collaborator's email address:</label> <input type="email" name="email" id="email"> <br>
              <label for="firstName">Collaborator's First Name:</label> <input type="text" name="firstName" id="firstName"> <br>
              <label for="lastName">Collaborator's Last Name:</label> <input type="text" name="lastName" id="lastName"> <br>
            </form>
          `
          modal.footer.innerHTML = `<button type="button" name="close" class="btn btn-secondary">Cancel</button> <button type="submit" for="modal-new-colab-form" class="btn btn-primary">Create Participant</button>`
    
          modal.footer.querySelector("button[name='close']").addEventListener("click", () => {
            modal.hide();
          })
    
          modal.body.querySelector("form").addEventListener("submit", se => {
            se.preventDefault(); se.stopPropagation();
            let form = se.target;
    
            let user = {
              userID: form.elements["email"],
              email: form.elements["email"],
              firstName: form.eleements["firstName"],
              lastName: form.elements["lastName"],
              role: "staff"
            }
    
            post("/admin/data/createuser/", user).then(
              response => { alert("User created successfully"); modal.hide(); },
              reject => { alert(reject); modal.hide(); }
            )
          })
    
          modal.show()
        })
    
        document.querySelector("#main_content").appendChild(holder)
    },
    resources: function() {
        var holder = document.createElement("div");
        holder.innerHTML = `
        <h3>Resources available in this app:</h3>
        <table>
          <tr>
            <th>Resource Name</th>
            <th>Description</th>
            <th>Thumbnail</th>
            <td>actions:</td>
          </tr>
        </table>`
    
        fetch("/app/resources").then(response => response.json())
        .then(resources => {
          Object.keys(resources).forEach(k => {
            holder.querySelector("table").insertAdjacentHTML("beforeend", `
              <tr>
                <td>${k}</td>
                <td>${resources[k].description}</td>
                <td>${ resources[k]['content-type'] === undefined || resources[k]['content-type'].startsWith("image")?
                        `<img class="thumb" src="${ resources[k].source == "none"? `/app/resources/files/${k}`: resources[k].source}"`:
                        "NO THUMBNAIL"
                      }</td>
                <td><button class="edit" data-resource="${k}">Edit</button><button class="delete" disabled>Delete</button></td>
              </tr>
            `)
          })
          holder.addEventListener("click", async e => {
            let src = e.target;
            
            if (src.matches("button.edit, button.edit *")) {
              while (src.tagName != "BUTTON" && src.parentNode) src = src.parentNode;
              if (src.tagName != "BUTTON") return;
    
              let resource = await fetch(`/app/resources/${src.dataset.resource}`).then(response => response.json());
    
              let m = createModal(true);
              m.size = "fs";
              let resourceholder = document.createElement("div");
              resourceholder.classList.add("row");
              let details = resourceholder.appendChild(document.createElement("div"))
              details.classList.add("col");
              details.innerHTML = `
                <h4>${resource.name}</h4>
                <div>
                  <label title="This must be a description of the content of the image, for accessibility purposes">Resource Description:</label><input type="text" name="description" value="${resource.description}"><br>
                  <label title="This may be descriptive text or additional information about the image which will be associated with it when it is rendered">Resource Caption:</label><input type="text" name="caption" value="${resource.caption}"<br>
                </div>
              `
              let preview = resourceholder.appendChild(document.createElement("div"));
              preview.classList.add("col");
              let source = resource.source == "useblob"? `/app/resources/files/${resource.name}`: resource.source;
              if (resource['content-type'].startsWith("image")) {
                preview.innerHTML = `<img src="${source}" class="preview" alt="${resource.description}" title="${resource.caption}" />`
              } else if (resource['content-type'].startsWith("video")) {
                preview.innerHTML = `<video controls src="${source}" title="${resource.caption}"><p>${resource.description}</p></video>`;
              }
    
              m.body.appendChild(resourceholder);
    
              m.footer.innerHTML = `<button class="btn btn-primary save" type="button">Save Changes</button><button class="btn btn-secondary cancel">Cancel</button>`
              m.footer.querySelector("button.save").addEventListener("click", e => {
                let caption = m.body.querySelector("input[name='caption']").value;
                let description = m.body.querySelector("input[name='description']").value;
    
                if (caption == resource.caption && description == resource.description) {
                  alert("No changes made to save"); return;
                }
    
                post("/admin/resources/", { name: resource.name, description: description, caption: caption})
                m.hide();
              })
              m.footer.querySelector("button.cancel").addEventListener("click", () => {
                m.hide();
              })
    
              m.show();
            }
          })
    
        })
        document.querySelector("#main_content").appendChild(holder)
    },
    scheduling: function() {
        var holder = document.createElement("section");
        let status = "";
        let refresh = () => {
          fetch("/admin/sched/status").then(response => response.json())
          .then(schedule => {
            status = schedule.status;
            let statuslabel = holder.querySelector("#sched-status");
            statuslabel.classList.remove(...statuslabel.classList.values())
    
            if (status == "stopped") {
              statuslabel.classList.add("stopped")
              statuslabel.textContent = "The scheduler is stopped";
              holder.querySelector("#schedule-items").innerHTML = "";
              holder.querySelector("button").textContent = "Start Scheduler"
            } else {
              statuslabel.classList.add("running")
              statuslabel.textContent = "The scheduler is running";
              holder.querySelector("button").textContent = "Stop Scheduler"
              fetch("/admin/sched/running").then(response => response.status == 204? false: response.json())
              .then(schedule => {
                if (!schedule) {
                  holder.querySelector("#schedule-items").innerHTML = "";
                } else {
                  schedule.operations.forEach(op => {
                    holder.querySelector("#schedule-items").insertAdjacentHTML("beforeend", `<span class="operation">${op}</span><br>`)
                  })
                }
              })
              holder.querySelector("#schedule-items").innerHTML = "";
    
            }
          })
        }
    
        holder.innerHTML = `
        <h4>Scheduled task management</h4>
        <div><span id="sched-status"></span> <button id="start-stop" class="btn btn-primary"></button></div>
        <div id="schedule-items"></div>
        `
        holder.querySelector("button").addEventListener("click", e => {
          if (status == "") return;
    
          if (status == "stopped") {
            fetch("/admin/sched/start", { method: "POST" });
          }  else {
            fetch("/admin/sched/stop", { method: "POST" });
          }
    
          refresh();
        })
    
        document.querySelector("#main_content").appendChild(holder)
        refresh();
    }
}

window.addEventListener("DOMContentLoaded", e => {
    let main = document.getElementById("main_content");
    let page = location.pathname.substring(location.pathname.lastIndexOf("/")+1);
    
    renderers[page]()
    //main.appendChild(renderers[page]());
})