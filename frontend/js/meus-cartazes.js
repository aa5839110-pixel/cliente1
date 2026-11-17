"use strict";

/*==========================
LISTA DE CARTAZES
==========================*/
let posters = JSON.parse(localStorage.getItem("posters")) || [];

/*==========================
SALVAR
==========================*/
function savePosters() {
    localStorage.setItem("posters", JSON.stringify(posters));
}

/*==========================
CRIAR NOVO CARTAZ
==========================*/
function createPoster() {

    const poster = {

        id: Date.now(),

        nome: "Novo Cartaz",

        criado: new Date().toLocaleDateString("pt-BR"),

        data: {
            title: "",
            subtitle: "",
            products: [],
            background: "#b70000"
        }

    };

    posters.push(poster);

    savePosters();

    localStorage.setItem("currentPoster", poster.id);

    window.location.href = "poster.html";

}