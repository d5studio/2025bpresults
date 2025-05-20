
document.querySelectorAll(".copy-svg").forEach(svg => {
  let tooltip = new bootstrap.Tooltip(svg, {
    trigger: "manual",
  });


  svg.addEventListener("click", function (event) {
    event.stopPropagation();
    event.preventDefault();

    let link = this.closest(".article-link").getAttribute("href");

    navigator.clipboard.writeText(link).then(() => {

      this.setAttribute("data-bs-original-title", "Copied!");
      tooltip.show();

      setTimeout(() => {
        tooltip.hide();
        this.setAttribute("data-bs-original-title", "Copy Link");
      }, 2000);
    }).catch(err => {
      console.error("Failed to copy link: ", err);
    });
  });
});

document.querySelectorAll(".copy-svg").forEach(svg => {
  let tooltip = new bootstrap.Tooltip(svg, {
    trigger: "manual",
  });

  svg.addEventListener("click", function (event) {
    event.stopPropagation();
    event.preventDefault();

    let newsItem = this.closest(".news-item");

    if (!newsItem) {
      return;
    }

    let linkElement = newsItem.querySelector("a");

    if (!linkElement) {
      return;
    }

    let link = linkElement.getAttribute("href");

    navigator.clipboard.writeText(link).then(() => {
      this.setAttribute("data-bs-original-title", "Copied!");
      tooltip.show();

      setTimeout(() => {
        tooltip.hide();
        this.setAttribute("data-bs-original-title", "Copy Link");
      }, 2000);
    }).catch(err => {
      console.error("Failed to copy link: ", err);
    });
  });

  document.addEventListener("click", function () {
    tooltip.hide();
  });
});