"use strict";

class PosterProduct {

    constructor(editor, product) {
        this.editor = editor;
        this.product = product;

        this.card = null;
        this.imageObject = null;
        this.nameObject = null;
        this.oldPriceObject = null;
        this.priceObject = null;
        this.installmentObject = null;
        this.seal = null;

        this.offerType = "normal";

        this.left = 0;
        this.top = 0;

        // Tamanho inicial da imagem
        this.imageScale = 220;
    }

    render(x, y) {
        this.left = x;
        this.top = y;

        fabric.Image.fromURL(this.product.image, { crossOrigin: "anonymous" }).then(img => {
            // Usa o tamanho definido em imageScale
            img.scaleToWidth(this.imageScale);
            img.set({
                left: 0,
                top: 0,
                selectable: false,
                evented: false
            });
            this.imageObject = img;

            this.nameObject = new fabric.Textbox(this.product.name, {
                left: 0,
                top: 0,
                width: 220,
                textAlign: "center",
                fontFamily: "Montserrat",
                fontWeight: "bold",
                fontSize: 22,
                fill: "#222",
                selectable: false,
                evented: false
            });

            this.oldPriceObject = new fabric.Text("", {
                left: 0,
                top: 0,
                originX: "center",
                fontSize: 18,
                fill: "#666",
                fontFamily: "Montserrat",
                linethrough: true,
                visible: false,
                selectable: false,
                evented: false
            });

            this.priceObject = new fabric.Text(
                `R$ ${Number(this.product.price1 || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                {
                    left: 0,
                    top: 0,
                    originX: "center",
                    fontFamily: "Anton",
                    fontSize: 42,
                    fill: "#d51f26",
                    selectable: false,
                    evented: false
                }
            );

            this.installmentObject = new fabric.Text("", {
                left: 0,
                top: 0,
                originX: "center",
                fontFamily: "Montserrat",
                fontSize: 20,
                fill: "#222",
                visible: false,
                selectable: false,
                evented: false
            });

            this.card = new fabric.Rect({
                left: x,
                top: y,
                width: 250,
                height: 410,
                rx: 18,
                ry: 18,
                fill: "#ffffff",
                shadow: new fabric.Shadow({
                    color: "rgba(0,0,0,.18)",
                    blur: 18,
                    offsetX: 0,
                    offsetY: 6
                })
            });

            this.card.objectType = "product";
            this.card.posterProduct = this;

            this.editor.canvas.add(this.card);
            this.editor.canvas.add(this.imageObject);
            this.editor.canvas.add(this.nameObject);
            this.editor.canvas.add(this.oldPriceObject);
            this.editor.canvas.add(this.priceObject);
            this.editor.canvas.add(this.installmentObject);

            this.loadSeal();
            this.updateLayout(); // layout inicial

            // Evento de movimento
            this.card.on("moving", () => {
                this.left = this.card.left;
                this.top = this.card.top;
                this.updateLayout();
            });

            // Evento de redimensionamento do card
            this.card.on("scaling", () => {
                this.left = this.card.left;
                this.top = this.card.top;
                this.updateLayout();
            });

            this.card.on("selected", () => {
                this.editor.showProductPanel(this);
            });

            this.editor.canvas.requestRenderAll();
        });
    }

    /*==========================
    ATUALIZA O LAYOUT COMPLETO – TUDO CENTRALIZADO
    ==========================*/
    updateLayout() {
        const cardLeft = this.card.left;
        const cardTop = this.card.top;
        const cardWidth = this.card.getScaledWidth();
        const cardHeight = this.card.getScaledHeight();
        const centerX = cardLeft + cardWidth / 2;

        // Imagem centralizada no topo
        const imgWidth = this.imageObject.getScaledWidth();
        const imgHeight = this.imageObject.getScaledHeight();
        this.imageObject.set({
            left: centerX - imgWidth / 2,
            top: cardTop + 15
        });

        // Nome abaixo da imagem
        const nameTop = cardTop + 15 + imgHeight + 15;
        this.nameObject.set({
            left: centerX,
            top: nameTop,
            width: cardWidth - 30,
            originX: "center",
            textAlign: "center"
        });
        const nameHeight = this.nameObject.getScaledHeight();

        // Preço antigo (se visível)
        let oldPriceHeight = 0;
        if (this.oldPriceObject.visible) {
            this.oldPriceObject.set({
                left: centerX,
                top: nameTop + nameHeight + 10,
                originX: "center"
            });
            oldPriceHeight = this.oldPriceObject.getScaledHeight() + 8;
        }

        // Preço principal
        const priceTop = nameTop + nameHeight + 10 + oldPriceHeight;
        this.priceObject.set({
            left: centerX,
            top: priceTop,
            originX: "center"
        });
        const priceHeight = this.priceObject.getScaledHeight();

        // Parcelamento (se visível)
        if (this.installmentObject.visible) {
            this.installmentObject.set({
                left: centerX,
                top: priceTop + priceHeight + 8,
                originX: "center"
            });
        }

        // Selo no canto superior direito
        if (this.seal) {
            this.seal.set({
                left: cardLeft + cardWidth - 90,
                top: cardTop - 15
            });
        }

        // Ajuste automático da altura do card
        const bottomMost = this.installmentObject.visible
            ? this.installmentObject.top + this.installmentObject.getScaledHeight()
            : priceTop + priceHeight;
        const neededHeight = bottomMost - cardTop + 20;
        if (neededHeight > cardHeight) {
            this.card.set({ height: neededHeight });
        }

        this.editor.canvas.requestRenderAll();
    }

    /*==========================
    REDIMENSIONAR IMAGEM DO PRODUTO
    ==========================*/
    setImageSize(size) {
        this.imageScale = size;
        this.imageObject.scaleToWidth(size);
        this.updateLayout(); // reposiciona tudo de acordo com o novo tamanho
        this.editor.canvas.requestRenderAll();
    }

    /*==========================
    ALTERAR COR DO FUNDO DO CARD
    ==========================*/
    setCardColor(color) {
        this.card.set({
            fill: color
        });
        this.editor.canvas.requestRenderAll();
    }

    /*==========================
    TIPO DA OFERTA
    ==========================*/
    setOfferType(type) {
        this.offerType = type;
        switch (type) {
            case "normal": this.showNormal(); break;
            case "promocao": this.showPromotion(); break;
            case "parcelado": this.showInstallment(); break;
            case "avista": this.showCash(); break;
        }
        this.updateLayout();
    }

    /*==========================
    PRODUTO NORMAL
    ==========================*/
    showNormal() {
        this.oldPriceObject.visible = false;
        this.installmentObject.visible = false;
        this.priceObject.visible = true;
        this.priceObject.set({
            text: `R$ ${Number(this.product.price1 || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        });
        this.fitPrice();
    }

    /*==========================
    PROMOÇÃO
    ==========================*/
    showPromotion() {
        this.oldPriceObject.visible = true;
        this.installmentObject.visible = false;
        this.priceObject.visible = true;
        this.oldPriceObject.set({
            text: `De R$ ${Number(this.product.oldPrice || this.product.price1).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        });
        this.priceObject.set({
            text: `POR R$ ${Number(this.product.price1).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            fill: "#d51f26"
        });
        this.fitPrice();
    }

    /*==========================
    PARCELAMENTO
    ==========================*/
    showInstallment() {
        this.oldPriceObject.visible = false;
        this.priceObject.visible = false;
        this.installmentObject.visible = true;
        this.installmentObject.set({
            text: `${this.product.times || 12}x de R$ ${Number(this.product.installment || 149.90).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            fontWeight: "bold"
        });
    }

    /*==========================
    À VISTA + PARCELADO
    ==========================*/
    showCash() {
        this.oldPriceObject.visible = false;
        this.priceObject.visible = true;
        this.installmentObject.visible = true;
        this.priceObject.set({
            text: `À vista R$ ${Number(this.product.price1).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        });
        this.installmentObject.set({
            text: `ou ${this.product.times || 12}x R$ ${Number(this.product.installment || 149.90).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        });
        this.fitPrice();
    }

    /*==========================
    AJUSTAR TAMANHO DO PREÇO
    ==========================*/
    fitPrice() {
        const text = this.priceObject.text.length;
        let size = 44;
        if (text > 13) size = 40;
        if (text > 15) size = 36;
        if (text > 17) size = 32;
        if (text > 19) size = 28;
        this.priceObject.set({ fontSize: size });
    }

    /*==========================
    ALTERAR NOME
    ==========================*/
    setName(name) {
        this.product.name = name;
        this.nameObject.set("text", name);
        this.updateLayout();
    }

    /*==========================
    ALTERAR PREÇO
    ==========================*/
    setPrice(price) {
        this.product.price1 = price;
        switch (this.offerType) {
            case "normal": this.showNormal(); break;
            case "promocao": this.showPromotion(); break;
            case "parcelado": this.showInstallment(); break;
            case "avista": this.showCash(); break;
        }
        this.updateLayout();
    }

    /*==========================
    ALTERAR PREÇO ANTIGO
    ==========================*/
    setOldPrice(price) {
        this.product.oldPrice = price;
        if (this.offerType === "promocao") this.showPromotion();
        this.updateLayout();
    }

    /*==========================
    ALTERAR PARCELA
    ==========================*/
    setInstallment(value) {
        this.product.installment = value;
        if (this.offerType === "parcelado") this.showInstallment();
        if (this.offerType === "avista") this.showCash();
        this.updateLayout();
    }

    /*==========================
    QUANTIDADE DE PARCELAS
    ==========================*/
    setTimes(times) {
        this.product.times = times;
        if (this.offerType === "parcelado") this.showInstallment();
        if (this.offerType === "avista") this.showCash();
        this.updateLayout();
    }

    /*==========================
    COR DO NOME
    ==========================*/
    setNameColor(color) {
        this.nameObject.set({ fill: color });
        this.updateLayout();
    }

    /*==========================
    COR DO PREÇO
    ==========================*/
    setPriceColor(color) {
        this.priceObject.set({ fill: color });
        this.installmentObject.set({ fill: color });
        this.updateLayout();
    }

    /*==========================
    DUPLICAR PRODUTO
    ==========================*/
    duplicate() {
        const novoProduto = JSON.parse(JSON.stringify(this.product));
        const novo = new PosterProduct(this.editor, novoProduto);
        novo.render(this.left + 40, this.top + 40);
    }

    /*==========================
    EXCLUIR PRODUTO
    ==========================*/
    remove() {
        this.editor.canvas.remove(this.card);
        this.editor.canvas.remove(this.imageObject);
        this.editor.canvas.remove(this.nameObject);
        this.editor.canvas.remove(this.oldPriceObject);
        this.editor.canvas.remove(this.priceObject);
        this.editor.canvas.remove(this.installmentObject);
        if (this.seal) this.editor.canvas.remove(this.seal);
        this.editor.canvas.requestRenderAll();
    }

    /*==========================
    CARREGAR SELO
    ==========================*/
    loadSeal() {
        if (!this.product.seal) return;

        fabric.Image.fromURL(this.product.seal, { crossOrigin: "anonymous" }).then(img => {
            img.scaleToWidth(110);
            img.set({ selectable: false, evented: false });
            this.seal = img;
            this.editor.canvas.add(img);
            this.updateLayout();
        });
    }

    /*==========================
    DEFINIR SELO
    ==========================*/
    setSeal(image) {
        this.product.seal = image;
        if (this.seal) this.editor.canvas.remove(this.seal);

        fabric.Image.fromURL(image, { crossOrigin: "anonymous" }).then(img => {
            img.scaleToWidth(110);
            img.set({ selectable: false, evented: false });
            this.seal = img;
            this.editor.canvas.add(img);
            this.updateLayout();
        });
    }

    /*==========================
    REMOVER SELO
    ==========================*/
    removeSeal() {
        this.product.seal = "";
        if (this.seal) {
            this.editor.canvas.remove(this.seal);
            this.seal = null;
        }
        this.updateLayout();
    }

}