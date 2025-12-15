// main.js
$(document).ready(function () {
  // Simple example jQuery usage for marks:
  // Change navbar shadow when scrolling
  $(window).on("scroll", function () {
    if ($(this).scrollTop() > 10) {
      $(".navbar").addClass("shadow");
    } else {
      $(".navbar").removeClass("shadow");
    }
  });
});
