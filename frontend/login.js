const toggle = document.getElementById("toggleSenha");
const senha = document.getElementById("password");

if (toggle && senha) {
  toggle.addEventListener("click", () => {
    if (senha.type === "password") {
      senha.type = "text";
      toggle.innerHTML = '<i class="fa fa-eye-slash"></i>';
    } else {
      senha.type = "password";
      toggle.innerHTML = '<i class="fa fa-eye"></i>';
    }
  });
}