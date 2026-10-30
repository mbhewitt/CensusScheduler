document.addEventListener("DOMContentLoaded", function () {
  // Census app copy: Back leaves the report dialog for the app's Reports page.
  var home = "/reports";
  var quarto = document.querySelector("#quarto-sidebar .sidebar-menu-container > ul");
  var gitbook = document.querySelector("ul.summary");
  var mlmenu = document.querySelector('#ml-menu ul[data-menu="main"]');
  var li = document.createElement("li");
  if (quarto) {
    li.className = "sidebar-item";
    li.innerHTML = '<div class="sidebar-item-container"><a class="sidebar-item-text sidebar-link"><span class="menu-text"><i class="bi bi-arrow-left-circle"></i> Back</span></a></div>';
    quarto.appendChild(li);
  } else if (gitbook) {
    li.className = "chapter";
    li.innerHTML = '<a><i class="fa fa-arrow-circle-o-left"></i> Back</a>';
    gitbook.appendChild(li);
  } else if (mlmenu) {
    // 2018's Codrops multi-level menu (no icon font with an arrow, so inline SVG)
    li.className = "menu__item";
    li.setAttribute("role", "menuitem");
    li.innerHTML = '<a class="menu__link"><svg viewBox="0 0 16 16" width="0.9em" height="0.9em" fill="currentColor" aria-hidden="true" style="vertical-align:-0.1em"><path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-4.5-.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5z"/></svg> Back</a>';
    mlmenu.appendChild(li);
  } else {
    return;
  }
  li.style.marginTop = "1em";   // a blank line's worth of space above Back
  li.querySelector("a").href = home;
  li.querySelector("a").target = "_top";
});
