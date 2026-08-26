function siteConfirm(message, title = "تأیید عملیات") {
  return new Promise((resolve) => {
    const wrap = document.createElement("div");
    wrap.className = "modal-bg";
    wrap.innerHTML =
      '<section class="modal glass confirm-modal"><div class="confirm-icon">⌫</div><h2></h2><p></p><div class="confirm-actions"><button class="secondary" type="button">انصراف</button><button class="danger-btn" type="button">بله، حذف شود</button></div></section>';
    wrap.querySelector("h2").textContent = title;
    wrap.querySelector("p").textContent = message;
    const finish = (value) => {
      wrap.remove();
      resolve(value);
    };
    wrap.addEventListener("mousedown", (e) => {
      if (e.target === wrap) finish(false);
    });
    wrap.querySelector(".secondary").onclick = () => finish(false);
    wrap.querySelector(".danger-btn").onclick = () => finish(true);
    document.body.appendChild(wrap);
  });
}
