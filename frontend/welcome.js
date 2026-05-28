window.addEventListener("DOMContentLoaded", () => {

  const splash = document.createElement("div");
  splash.id = "welcomeScreen";

  splash.innerHTML = `
    <h1>👋 Bem-vindo ao Catálogo</h1>
    <p>Carregando...</p>
    <div class="loader"></div>
  `;

  document.body.appendChild(splash);

  // 🔥 GARANTE que sempre remove
  setTimeout(() => {
    splash.style.opacity = "0";

    setTimeout(() => {
      if (splash) splash.remove();
    }, 500);

  }, 2000); // tempo da animação
});

setTimeout(() => {
  const splash = document.getElementById("welcomeScreen");
  if (splash) splash.remove();
}, 4000);