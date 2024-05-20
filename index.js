//#region Options Menu
    function openOptions() {
        lastHash = window.location.hash;
        window.location.href = '#options'
    }
    
    function closeOptions() {
        window.location.href = lastHash
    }

    // Toggle .fav or .position attribute
    function toggleVisibility(id, isfav) {
        var jsonItem = findJsonItem(id, apps)
        
        if (isfav) jsonItem.fav = (jsonItem.fav !== -1) ? -1 : getFavApps().length;
        else jsonItem.position = (jsonItem.position !== -1) ? -1 : getVisibleBrothers(id).length;

        reloadItems()
    }

    function createOptionsList(panelID) {
        // Find which panel we want to populate
        var panel = document.getElementById(panelID);                    
        var tempString = panel.innerHTML = '';
        var ismenu = panelID === 'menupanel';

        tempString += '<ul style="columns: 2";>';
        for (const [appkey, app] of Object.entries(apps)) {
            // Save children in childrenstring
            var children = "";
            for (const [subappkey, subapp] of Object.entries(app).slice(6)) {
                children += `<li>
                <input type="checkbox" ${(ismenu ? (subapp.position > -1 ? 'checked' : '') : (subapp.fav == -1 ? '' : 'checked'))}
                    id="${subappkey}" 
                    class="${ismenu ? 'menucheckbox' : 'favcheckbox'}"
                    onclick="toggleVisibility(this.id, ${!ismenu})">
                <label for="${subappkey}" class="optiontoggle">${subapp.displaytext}</label></li>`
            }
            // Write on screen
            if (!children || !ismenu) {
                tempString += `<li>
                <input type="checkbox" ${(ismenu ? (app.position > -1 ? 'checked' : '') : (app.fav == -1 ? '' : 'checked'))}
                    id="${appkey}" 
                    class="${ismenu ? 'menucheckbox' : 'favcheckbox'}"
                    onclick="toggleVisibility(this.id, ${!ismenu})">
                <label for="${appkey}" class="optiontoggle" >${app.displaytext}</label></li>`;  
            }
            // Add space at end only there's children
            if (children) tempString += `${children}</br>`; 
        }
        tempString += '</ul>';

        // Add save button
        tempString += `</br><input type="submit" value="Save" id="save">`;
        panel.innerHTML = tempString;
        // Register save event to button
        document.querySelectorAll('#save').forEach(e => e.addEventListener('click', saveAppConfig));
    }
    //#endregion Options Menu
    
    //#region Floating buttons
    function floatingATag(app, appkey, fav) {
        return `<a id="${fav ? 'fav-' : 'floating-'}${appkey}" class="tile" href="${app.link}" target="${app.target}">
                    <img src="${app.img}" />
                    <p>${app.displaytext}</p>
                </a>`;
    }

    function createGrid() {
        function createFloatingButton(gridName) {    
            var gridString =`<div id=${gridName} class="floatingbutton">`;
            if (gridName !== "fav") { 
                // Populate floatingapps with the list of apps that should be visible
                Object.entries(apps).forEach(([appkey, app]) => {
                    if (appkey !== gridName) return;
                    Object.entries(app).slice(6).sort(([keyA, appA], [keyB, appB]) => appA.position - appB.position).forEach(([subappkey, subapp]) => {
                        // Populate gridString with floatingApps
                        if (subapp.position > -1)  gridString += floatingATag(subapp, subappkey, false);
                    });
                });
            }
            // Populate gridString with favApps
            else getFavApps().forEach((favapp) => gridString += floatingATag(favapp.app, favapp.appkey, true));

            // Close gridString and write it to the web
            gridString += `</div>`;
            grid[0].innerHTML += gridString;
        }
        // Clear grid
        var grid = document.getElementsByClassName('grid');
        grid[0].innerHTML = '';
        
        // Create a grid and populate it for each parent app
        for (const [appkey, app] of Object.entries(apps).filter(([app]) => !findJsonParent(app)))
            if (Object.entries(app).slice(6).some(([subapp]) => subapp)) createFloatingButton(appkey);

        // Create fav grid
        createFloatingButton("fav");

        // Show current hash's apps
        showFloatingApps();
    }

    // Drag floating items
    $(function() {
        $(".grid").sortable({
            items: ".tile",
            update: function(event, ui) {
                // Edit apps based on current order
                var parentId = ui.item.parent().attr("id");
                var prefixLength = parentId === "fav" ? "fav-" : "floating-";
                ui.item.parent().children("a").each(function(index, element) {
                    var jsonItem = findJsonItem($(element).attr("id").substring(prefixLength.length), apps);
                    
                    if (parentId !== "fav" && jsonItem.position > -1) jsonItem.position = index;
                    else if (jsonItem.fav > -1) jsonItem.fav = index;
                });
                
                // Save changes
                saveAppConfig();
            }
        });
    });

    // Show floating buttons depending on url hash
    function showFloatingApps() {
        const currentHash = window.location.hash.substring(1);
        document.querySelectorAll('.floatingbutton').forEach(function(button) {
            // In options, show lastHash's grid. If there's none, show fav
            if (currentHash === "options") button.style.display = (button.getAttribute('id') === (lastHash.substring(1) !== "" ? lastHash.substring(1) : "fav")) ? 'block' : 'none'
            // If hash is empty, show fav grid
            else if (currentHash === "" || currentHash === "#") button.style.display = (button.getAttribute('id') === "fav") ? 'block' : 'none'
            // Show hash's panel
            else button.style.display = (button.getAttribute('id') === currentHash) ? 'block' : 'none'
        });            
    }
    //#endregion Floating buttons

    //#region Dropdown Menu
    // Drag Menu items
    function initializeSortableMenu() {
        var sortableContainer = $(".sortable-container");
        sortableContainer.sortable({
            items: "> li",
            cursor: "move",
            opacity: 0.6,
            axis: "y",
            update: (event, ui) => {                          
                // Edit apps based on current order
                ui.item.parent().children("li").each(function(index, element) {
                    var jsonItem = findJsonItem($(element).find('a').attr("id").substring("dropdown-".length), apps)
                    if (jsonItem.position > -1) jsonItem.position = index
                });
                saveAppConfig();
            },
            start: (event, ui) => ui.item.addClass("dragging"),
            stop: (event, ui) => ui.item.removeClass("dragging")
        });
    }

    function toggleParentVisibility() {
        document.querySelectorAll('.submenu').forEach(function(submenu) {
            const visibleCount = [...submenu.querySelectorAll('a')].filter(aTag => !aTag.classList.contains('hidden'));
            // if more than onechild, keep parent visible
            if (visibleCount.length > 1) submenu.parentNode.classList.toggle("hidden", false);
            // If only one child, replace parent
            else if (visibleCount.length == 1) {
                var app = submenu.parentNode.querySelector('a')
                app.parentNode.classList.remove("parent");

                var clone = visibleCount[0].cloneNode(true)
                clone.id = app.id;
                app.parentNode.replaceChild(clone, app);                
            }
            // If none, hide
            else if (visibleCount.length <= 0) submenu.parentNode.classList.toggle("hidden", true);
        });
    }

    function menuaATag(app, appkey) {
        return  `<a id="dropdown-${appkey}" class="menu__item ${app.position > -1 ? '' : 'hidden'}" href="${app.link}" target="${app.target}">
                    <img src="${app.img}" />
                    ${app.displaytext}
                </a>`
    }

    // Clear current menu and create new ones
    function createMenus(apps) {
        var menucontainer = document.getElementById('menu-container');   
        menucontainer.innerHTML = '';
        Object.entries(apps).sort(([, a], [, b]) => a.position - b.position).forEach(([appkey, app]) => {
            // Store children in childstring
            var childstring = '';
            var isParent = false;
            Object.entries(app).slice(6).sort(([, a], [, b]) => a.position - b.position).forEach(([subappkey, subapp]) => {
                isParent = true
                childstring += `<li class="ui-sortable-handle">${menuaATag(subapp, subappkey)}</li>`;
            });
            // Create parent + children inside
            var appstring =`<li class="ui-sortable-handle ${isParent ? 'parent' : ''}">${menuaATag(app, appkey)}
                ${isParent ? '<ul class="sortable-container submenu ui-sortable">' : ''}
                ${childstring}`;
            // Close parent tag
            appstring += `${isParent ? '</ul>' : ''}</li>`
            menucontainer.innerHTML += appstring;
        });

        toggleParentVisibility(); // Hide parent if no childs are visible
        initializeSortableMenu();
    }    
    //#endregion             

    //#region Getter Functions
    function getFavApps() {
        var favapps = [];
        Object.entries(apps).forEach(([appkey, app]) => {
            if (app.fav > -1) favapps.push({ "app": app, "appkey": appkey});
            Object.entries(app).slice(6).forEach(([subappkey, subapp]) => {
                if (subapp.fav > -1) favapps.push({ "app": subapp, "appkey": subappkey});
            });
        });
        favapps.sort((a, b) => a.app.fav - b.app.fav);
        return favapps
    }

    function getVisibleBrothers(id) {
        var brotherpps = []; // Save them in a list
        var parentkey = findJsonParent(id);
        Object.entries(apps).forEach(([appkey, app]) => { // Foreach App
            if (!parentkey) {
                if (app.position > -1) brotherpps.push(app);
            }
            else if (parentkey === appkey){
                // Read subMenu Items
                Object.entries(app).slice(6).forEach(([subappkey, subapp]) => {
                    if (subapp.position > -1) brotherpps.push(subapp);
                });
            }
        });
        // Sort by .position value
        return brotherpps.sort((a, b) => a.position - b.position);
    }

    function findJsonItem(id, appsJson) {
        for (const [appkey, app] of Object.entries(appsJson)) { // foreach app  
            for (const [subappkey, subapp] of Object.entries(app).slice(6)) { // foreach subapp
                if (subappkey === id) return subapp;
            }
            if (appkey === id) return app;
        }
        return null;
    }

    function findJsonParent(id) {
        for (const [appkey, app] of Object.entries(apps)) { // foreach app  
            for (const [subappkey, subapp] of Object.entries(app).slice(6)) // foreach subapp
                if (subappkey === id) return appkey;
        }
        return null;
    }

    //#endregion

    //#region Misc
    // Delete and Create apps again
    function reloadItems() {    
        createMenus(apps)       
        createGrid()
    }

    // Save app configuration locally
    function saveAppConfig() {
        localStorage.setItem('apps', JSON.stringify(apps))
        reloadItems();
    }

    function appPref(key, position, fav) {
        this.key = key;
        this.position = position;
        this.fav = fav;
    }

    function updateLocalApps() {
        // Export preferences
        var preferences = []
        for (const [appkey, app] of Object.entries(localApps)) {
            // SubApps
            for (const [subappkey, subapp] of Object.entries(app).slice(6)) {
                preferences.push(new appPref(subappkey, subapp.position, subapp.fav))                
            }
            // Apps
            preferences.push(new appPref(appkey, app.position, app.fav))
        }

        // Update Apps
        // Overwritting localApps we ADD new apps and REMOVE old ones
        localApps = ogApps;
        preferences.forEach(e => {
            var jsonItem = findJsonItem(e.key, localApps)
            if (jsonItem) {
                jsonItem.position = e.position;
                jsonItem.fav = e.fav;
            }
        });
    }

    var lastHash = "#"
    var localApps = JSON.parse(localStorage.getItem('apps'))
    if (localApps) updateLocalApps();
    var apps = localApps || ogApps;

    // Initial execution scripts
    //document.querySelector('.dropdownButton').classList.add('active'); //TODO: Change this in preferences tab
    createMenus(apps)
    createGrid();

    // Detect hash changes
    window.addEventListener('hashchange', showFloatingApps);
    // Generate options panels
    createOptionsList('menupanel')
    createOptionsList('favpanel')
    //#endregion