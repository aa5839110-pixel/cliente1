"use strict";

class PosterEditor {

    constructor() {
        this.data = JSON.parse(localStorage.getItem("posterData")) || {};
        this.canvas = null;
        this.products = [];
        this.selectedObject = null;
    }

    init() {
        this.createCanvas();
        this.loadHeader();
        this.loadProducts();
        this.createEvents();
    }

    createCanvas() {
        this.canvas = new fabric.Canvas("posterCanvas", {
            backgroundColor: "#b70000",
            width: 900,
            height: 1200,
            preserveObjectStacking: true
        });
    }

    loadHeader() {
        this.title = new fabric.Text(
            this.data.title || "SEMANA DA RENOVAÇÃO",
            {
                left: 450,
                top: 70,
                originX: "center",
                fill: "#ffffff",
                fontSize: 46,
                fontWeight: "bold",
                fontFamily: "Montserrat"
            }
        );

        this.subtitle = new fabric.Text(
            this.data.subtitle || "Até 12x sem juros",
            {
                left: 450,
                top: 130,
                originX: "center",
                fill: "#ffffff",
                fontSize: 24,
                fontFamily: "Montserrat"
            }
        );

        this.title.objectType = "title";
        this.subtitle.objectType = "subtitle";

        this.canvas.add(this.title);
        this.canvas.add(this.subtitle);

        this.title.on("selected", () => {
            this.showTitleProperties();
        });
    }

    loadProducts() {
        if (!this.data.products) return;

        let x = 40;
        let y = 220;

        this.data.products.forEach(product => {
            const card = new PosterProduct(this, product);
            card.render(x, y);
            this.products.push(card);

            x += 270;
            if (x > 580) {
                x = 40;
                y += 420;
            }
        });
    }

    createEvents() {
        // Seleção de objetos
        this.canvas.on("selection:created", (e) => {
            const obj = e.selected[0];
            this.showProperties(obj);
        });

        this.canvas.on("selection:updated", (e) => {
            const obj = e.selected[0];
            this.showProperties(obj);
        });

        this.canvas.on("selection:cleared", () => {
            document.getElementById("propertiesPanel").innerHTML = "";
        });

        // Adicionar Texto
        document.getElementById("addTextBtn").onclick = () => {
            const texto = new fabric.Textbox("Novo Texto", {
                left: 300,
                top: 300,
                width: 250,
                fontSize: 40,
                fill: "#ffffff",
                fontFamily: "Montserrat",
                editable: true
            });
            texto.objectType = "text";
            this.canvas.add(texto);
            this.canvas.setActiveObject(texto);
            this.showTextPanel(texto);
        };

        // Adicionar Logo
        const addLogoBtn = document.getElementById("addLogoBtn");
        const logoInput = document.getElementById("logoInput");
        if (addLogoBtn) {
            addLogoBtn.onclick = () => {
                logoInput.click();
            };
        }
        if (logoInput) {
            logoInput.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    this.addLogo(reader.result);
                };
                reader.readAsDataURL(file);
            };
        }

        // ===== COR DE FUNDO =====
        const bgColorInput = document.getElementById("canvasBgColor");
        if (bgColorInput) {
            bgColorInput.value = this.canvas.backgroundColor;  // sincroniza valor inicial
            bgColorInput.addEventListener("input", (e) => {
                this.canvas.backgroundColor = e.target.value;
                this.canvas.renderAll();
            });
        }

        // ===== SALVAR / CARREGAR (últimos 3 cartazes) =====
        const saveBtn = document.getElementById("savePosterBtn");
        const loadSelect = document.getElementById("loadPosterSelect");
        const loadBtn = document.getElementById("loadPosterBtn");

        const updateSavedList = () => {
            const saved = JSON.parse(localStorage.getItem("savedPosters")) || [];
            if (loadSelect) {
                loadSelect.innerHTML = '<option value="">Carregar salvo...</option>';
                saved.forEach((poster, i) => {
                    const opt = document.createElement("option");
                    opt.value = i;
                    opt.textContent = poster.title || `Cartaz ${i + 1}`;
                    loadSelect.appendChild(opt);
                });
            }
            if (loadBtn) loadBtn.disabled = saved.length === 0;
        };

        if (saveBtn) {
            saveBtn.onclick = () => {
                this.saveCurrentPoster();
                updateSavedList();
            };
        }

        if (loadBtn) {
            loadBtn.onclick = () => {
                const idx = loadSelect?.value;
                if (idx !== "") {
                    this.loadPoster(Number(idx));
                    updateSavedList();
                }
            };
        }

        updateSavedList();

        if (loadSelect) {
            loadSelect.onchange = () => {
                if (loadBtn) loadBtn.disabled = loadSelect.value === "";
            };
        }

        // ===== IMPRIMIR =====
        const printBtn = document.getElementById("printPoster");
        if (printBtn) {
            printBtn.onclick = () => {
                this.printPoster();
            };
        }

        // Outros eventos (inputs antigos mantidos)
        const titleInput = document.getElementById("posterTitle");
        if (titleInput) {
            titleInput.value = this.data.title || "";
            titleInput.addEventListener("input", e => {
                this.title.set("text", e.target.value);
                this.canvas.renderAll();
            });
        }

        const subtitleInput = document.getElementById("posterSubtitle");
        if (subtitleInput) {
            subtitleInput.value = this.data.subtitle || "";
            subtitleInput.addEventListener("input", e => {
                this.subtitle.set("text", e.target.value);
                this.canvas.renderAll();
            });
        }
    }

    /*==========================
    ADICIONAR LOGO
    ==========================*/
    addLogo(image) {
        fabric.Image.fromURL(image).then(img => {
            img.scaleToWidth(180);
            img.set({
                left: 350,
                top: 1000,
                cornerColor: "#2196f3",
                borderColor: "#2196f3"
            });
            img.objectType = "logo";
            this.canvas.add(img);
            this.canvas.setActiveObject(img);
            this.canvas.renderAll();
        });
    }

    /*==========================
    MOSTRAR PROPRIEDADES DO OBJETO SELECIONADO
    ==========================*/
    showProperties(obj) {
        if (!obj) return;
        if (obj.objectType === "title") {
            this.showTitlePanel(obj);
            return;
        }
        if (obj.objectType === "subtitle") {
            this.showSubtitlePanel(obj);
            return;
        }
        if (obj.objectType === "product") {
            this.showProductPanel(obj.posterProduct);
            return;
        }
        if (obj.objectType === "text") {
            this.showTextPanel(obj);
            return;
        }
    }

    showTitleProperties() {
        this.showTitlePanel(this.title);
    }

    /*==========================
    PAINEL DO TÍTULO
    ==========================*/
    showTitlePanel(obj) {
        const panel = document.getElementById("propertiesPanel");
        panel.innerHTML = `
            <div class="property-group">
                <h3>Título</h3>
                <label>Texto</label>
                <input id="titleText" value="${obj.text}">
                <label>Fonte</label>
                <select id="titleFont">
                    <option ${obj.fontFamily === "Montserrat" ? "selected" : ""}>Montserrat</option>
                    <option ${obj.fontFamily === "Poppins" ? "selected" : ""}>Poppins</option>
                    <option ${obj.fontFamily === "Anton" ? "selected" : ""}>Anton</option>
                    <option ${obj.fontFamily === "Oswald" ? "selected" : ""}>Oswald</option>
                    <option ${obj.fontFamily === "Bebas Neue" ? "selected" : ""}>Bebas Neue</option>
                </select>
                <label>Tamanho</label>
                <input type="range" id="titleSize" min="20" max="100" value="${obj.fontSize}">
                <label>Cor</label>
                <input type="color" id="titleColor" value="${obj.fill}">
            </div>
        `;
        document.getElementById("titleText").oninput = e => { obj.set("text", e.target.value); this.canvas.renderAll(); };
        document.getElementById("titleSize").oninput = e => { obj.set("fontSize", Number(e.target.value)); this.canvas.renderAll(); };
        document.getElementById("titleFont").onchange = e => { obj.set("fontFamily", e.target.value); this.canvas.renderAll(); };
        document.getElementById("titleColor").oninput = e => { obj.set("fill", e.target.value); this.canvas.renderAll(); };
    }

    /*==========================
    PAINEL DO SUBTÍTULO
    ==========================*/
    showSubtitlePanel(obj) {
        const panel = document.getElementById("propertiesPanel");
        panel.innerHTML = `
            <div class="property-group">
                <h3>Subtítulo</h3>
                <label>Texto</label>
                <input id="subtitleText" value="${obj.text}">
                <label>Fonte</label>
                <select id="subtitleFont">
                    <option ${obj.fontFamily === "Montserrat" ? "selected" : ""}>Montserrat</option>
                    <option ${obj.fontFamily === "Poppins" ? "selected" : ""}>Poppins</option>
                    <option ${obj.fontFamily === "Roboto" ? "selected" : ""}>Roboto</option>
                    <option ${obj.fontFamily === "Anton" ? "selected" : ""}>Anton</option>
                    <option ${obj.fontFamily === "Oswald" ? "selected" : ""}>Oswald</option>
                    <option ${obj.fontFamily === "Bebas Neue" ? "selected" : ""}>Bebas Neue</option>
                </select>
                <label>Tamanho</label>
                <input type="range" id="subtitleSize" min="14" max="70" value="${obj.fontSize}">
                <label>Cor</label>
                <input type="color" id="subtitleColor" value="${obj.fill}">
            </div>
        `;
        document.getElementById("subtitleText").oninput = e => { obj.set("text", e.target.value); this.canvas.renderAll(); };
        document.getElementById("subtitleSize").oninput = e => { obj.set("fontSize", Number(e.target.value)); this.canvas.renderAll(); };
        document.getElementById("subtitleFont").onchange = e => { obj.set("fontFamily", e.target.value); this.canvas.renderAll(); };
        document.getElementById("subtitleColor").oninput = e => { obj.set("fill", e.target.value); this.canvas.renderAll(); };
    }

    /*==========================
    PAINEL DO TEXTO
    ==========================*/
    showTextPanel(obj) {
        const panel = document.getElementById("propertiesPanel");
        panel.innerHTML = `
            <div class="property-group">
                <h3>Texto</h3>
                <label>Texto</label>
                <input id="freeText" value="${obj.text}">
                <label>Fonte</label>
                <select id="freeFont">
                    <option ${obj.fontFamily === "Montserrat" ? "selected" : ""}>Montserrat</option>
                    <option ${obj.fontFamily === "Poppins" ? "selected" : ""}>Poppins</option>
                    <option ${obj.fontFamily === "Anton" ? "selected" : ""}>Anton</option>
                    <option ${obj.fontFamily === "Bebas Neue" ? "selected" : ""}>Bebas Neue</option>
                    <option ${obj.fontFamily === "Oswald" ? "selected" : ""}>Oswald</option>
                    <option ${obj.fontFamily === "Roboto" ? "selected" : ""}>Roboto</option>
                </select>
                <label>Tamanho</label>
                <input type="range" id="freeSize" min="10" max="150" value="${obj.fontSize}">
                <label>Cor</label>
                <input type="color" id="freeColor" value="${obj.fill}">
                <button id="deleteText"><i class="fa-solid fa-trash"></i> Excluir Texto</button>
            </div>
        `;
        document.getElementById("freeText").oninput = e => { obj.set("text", e.target.value); this.canvas.renderAll(); };
        document.getElementById("freeFont").onchange = e => { obj.set("fontFamily", e.target.value); this.canvas.renderAll(); };
        document.getElementById("freeSize").oninput = e => { obj.set("fontSize", Number(e.target.value)); this.canvas.renderAll(); };
        document.getElementById("freeColor").oninput = e => { obj.set("fill", e.target.value); this.canvas.renderAll(); };
        document.getElementById("deleteText").onclick = () => {
            this.canvas.remove(obj);
            this.canvas.renderAll();
            panel.innerHTML = "";
        };
    }

    /*==========================
    PAINEL DO PRODUTO
    ==========================*/
    showProductPanel(product) {
        const panel = document.getElementById("propertiesPanel");
        panel.innerHTML = `
            <div class="property-group">
                <h3>Produto</h3>
                <label>Nome</label>
                <input type="text" id="productName" value="${product.product.name}">
                <label>Tamanho da imagem</label>
                <input type="range" id="imageSize" min="120" max="280" value="${product.imageScale || 220}">
                <label>Tipo da Oferta</label>
                <select id="offerType">
                    <option value="normal" ${product.offerType === "normal" ? "selected" : ""}>Normal</option>
                    <option value="promocao" ${product.offerType === "promocao" ? "selected" : ""}>Promoção</option>
                    <option value="parcelado" ${product.offerType === "parcelado" ? "selected" : ""}>Parcelado</option>
                    <option value="avista" ${product.offerType === "avista" ? "selected" : ""}>À Vista + Parcelado</option>
                </select>
                <label>Preço Atual</label>
                <input type="number" step="0.01" id="productPrice" value="${product.product.price1 || 0}">
                <label>Preço Antigo</label>
                <input type="number" step="0.01" id="productOldPrice" value="${product.product.oldPrice || 0}">
                <label>Quantidade de Parcelas</label>
                <input type="number" id="productTimes" value="${product.product.times || 12}">
                <label>Valor da Parcela</label>
                <input type="number" step="0.01" id="productInstallment" value="${product.product.installment || 0}">
                <hr>
                <label>Selos</label>
                <div id="sealGallery"></div>
                <hr>
                <label>Cor do Nome</label>
                <input type="color" id="nameColor" value="#222222">
                <label>Cor do Preço</label>
                <input type="color" id="priceColor" value="#d51f26">
                <label>Fundo do Card</label>
                <input type="color" id="cardColor" value="${product.card.fill}">
                <hr>
                <button id="duplicateProduct"><i class="fa-solid fa-copy"></i> Duplicar Produto</button>
                <button id="deleteProduct"><i class="fa-solid fa-trash"></i> Excluir Produto</button>
            </div>
        `;

        const seals = ["seals/ofertas.png"];
        const gallery = document.getElementById("sealGallery");
        gallery.innerHTML = "";
        seals.forEach(file => {
            const img = document.createElement("img");
            img.src = file;
            img.className = "seal-thumb";
            img.onclick = () => product.setSeal(file);
            gallery.appendChild(img);
        });

        document.getElementById("offerType").value = product.offerType;

        document.getElementById("productName").oninput = e => product.setName(e.target.value);
        document.getElementById("imageSize").oninput = e => product.setImageSize(Number(e.target.value));
        document.getElementById("offerType").onchange = e => product.setOfferType(e.target.value);
        document.getElementById("productPrice").oninput = e => product.setPrice(Number(e.target.value));
        document.getElementById("productOldPrice").oninput = e => product.setOldPrice(Number(e.target.value));
        document.getElementById("productInstallment").oninput = e => product.setInstallment(Number(e.target.value));
        document.getElementById("productTimes").oninput = e => product.setTimes(Number(e.target.value));
        document.getElementById("nameColor").oninput = e => product.setNameColor(e.target.value);
        document.getElementById("priceColor").oninput = e => product.setPriceColor(e.target.value);
        document.getElementById("cardColor").oninput = e => product.setCardColor(e.target.value);
        document.getElementById("duplicateProduct").onclick = () => product.duplicate();
        document.getElementById("deleteProduct").onclick = () => {
            product.remove();
            panel.innerHTML = "";
        };
    }

    /*==========================
    SALVAR CARTAZ ATUAL (mantém os 3 últimos)
    ==========================*/
    saveCurrentPoster() {
        const posterState = {
            title: this.title.text,
            subtitle: this.subtitle.text,
            backgroundColor: this.canvas.backgroundColor,
            products: this.products.map(p => ({
                ...p.product,
                imageScale: p.imageScale,
                offerType: p.offerType,
                left: p.left,
                top: p.top,
                seal: p.product.seal || ""
            }))
        };

        let saved = JSON.parse(localStorage.getItem("savedPosters")) || [];
        saved.unshift(posterState);
        if (saved.length > 3) saved = saved.slice(0, 3);
        localStorage.setItem("savedPosters", JSON.stringify(saved));
        alert("Cartaz salvo! (últimos 3 mantidos)");
    }

    /*==========================
    CARREGAR CARTAZ SALVO (índice 0 = mais recente)
    ==========================*/
    loadPoster(index) {
        const saved = JSON.parse(localStorage.getItem("savedPosters")) || [];
        if (!saved[index]) return alert("Nenhum cartaz salvo nessa posição.");

        const state = saved[index];
        this.data.title = state.title;
        this.data.subtitle = state.subtitle;
        this.data.products = state.products;
        this.canvas.backgroundColor = state.backgroundColor;

        this.products.forEach(p => p.remove());
        this.products = [];

        if (state.products) {
            let x = 40, y = 220;
            state.products.forEach((prod, i) => {
                const card = new PosterProduct(this, prod);
                card.render(x, y);
                if (prod.offerType) card.setOfferType(prod.offerType);
                if (prod.imageScale) card.setImageSize(prod.imageScale);
                this.products.push(card);
                x += 270;
                if (x > 580) { x = 40; y += 420; }
            });
        }

        this.title.set({ text: state.title });
        this.subtitle.set({ text: state.subtitle });
        this.canvas.renderAll();
        document.getElementById("propertiesPanel").innerHTML = "";
    }

    /*==========================
    IMPRIMIR CARTAZ (SEM MARGENS)
    ==========================*/
    printPoster() {
        const data = this.canvas.toDataURL({
            format: "png",
            multiplier: 3
        });

        const win = window.open("", "_blank");
        win.document.write(`
            <html>
            <head>
                <title>Imprimir</title>
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    * {
                        margin: 0;
                        padding: 0;
                    }
                    html, body {
                        width: 100%;
                        height: 100%;
                    }
                    body {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    img {
                        width: 210mm;
                        height: 297mm;
                        object-fit: fill;
                        display: block;
                    }
                    @media print {
                        html, body {
                            width: 210mm;
                            height: 297mm;
                        }
                    }
                </style>
            </head>
            <body>
                <img src="${data}">
                <script>
                    window.onload = () => {
                        window.print();
                        window.close();
                    }
                <\/script>
            </body>
            </html>
        `);
        win.document.close();
    }

}