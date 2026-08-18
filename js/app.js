/*

iniciar aplicación
cambiar entre vistas
coordinar elementos generales

*/

const btnPos = document.querySelector("#btn-nav-pos");
const btnProductos = document.querySelector("#btn-nav-productos");
const btnHistorial = document.querySelector("#btn-nav-historial");
const vistaPos = document.querySelector("#vista-pos");
const vistaProductos = document.querySelector("#vista-productos");
const vistaHistorial = document.querySelector("#vista-historial");


function mostrarVista (vistaAMostrar){
    vistaPos.classList.add("vista-oculta");
    vistaProductos.classList.add("vista-oculta");
    vistaHistorial.classList.add("vista-oculta");

    vistaAMostrar.classList.remove("vista-oculta");
}

btnPos.addEventListener("click", () => {
    mostrarVista(vistaPos);
});

btnProductos.addEventListener("click", () => {
    mostrarVista(vistaProductos);
});

btnHistorial.addEventListener("click", () => {
    mostrarVista(vistaHistorial);
});
