"use strict";

/*==========================
CARREGAR DADOS
==========================*/
const data=JSON.parse(localStorage.getItem("posterData"))||{};

/*==========================
CANVAS
==========================*/
const canvas=new fabric.Canvas("posterCanvas",{
backgroundColor:"#d51f26",
width:900,
height:1200,
preserveObjectStacking:true
});

/*==========================
TÍTULO
==========================*/
const titulo=new fabric.Text(
data.title||"SEMANA DA RENOVAÇÃO",
{
left:450,
top:80,
originX:"center",
fill:"#ffffff",
fontSize:46,
fontWeight:"bold",
fontFamily:"Montserrat"
});

canvas.add(titulo);

/*==========================
SUBTÍTULO
==========================*/
const subtitulo=new fabric.Text(
data.subtitle||"Até 12x sem juros",
{
left:450,
top:140,
originX:"center",
fill:"#ffffff",
fontSize:24,
fontFamily:"Montserrat"
});

canvas.add(subtitulo);