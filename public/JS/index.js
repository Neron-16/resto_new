// mobile menu
const burgerIcon = document.querySelector('#burger');
const navbarMenu = document.querySelector('#navbarBasicExample');

burgerIcon.addEventListener('click',() =>{
    navbarMenu.classList.toggle('is-active')
})

// carrousel
const photocontainer = document.querySelector(".carousel-images");
const photos = document.querySelectorAll('.carousel-images img');

//moving variables
let counter = 1;
const size = photos[0].clientWidth;
photocontainer.style.transform = 'translateX('+ (-size * counter) + 'px)';

//buttons var
const nextbtn = document.querySelector('#nextbtn');
const prevbtn = document.querySelector('#prevbtn');
nextbtn.addEventListener('click' , function(){
    if(counter >= photos.length -1  ) return;
    photocontainer.style.transition = 'transform 0.5s ease-in-out';
    counter++;
    photocontainer.style.transform = 'translateX('+ (-size * counter) + 'px)';
});
prevbtn.addEventListener('click' , function(){
    if(counter <= 0) return;
    photocontainer.style.transition = 'transform 0.5s ease-in-out';
    counter--;
    photocontainer.style.transform = 'translateX('+ (-size * counter) + 'px)';
});
photocontainer.addEventListener('transitionend' , function(){
    if(photos[counter].alt === 'Entrée' && counter === photos.length - 1){
       photocontainer.style.transition ='none';
       counter = 1;
       photocontainer.style.transform = 'translateX('+ (-size * counter) + 'px)';
    }
    if( photos[counter].alt === 'Entrée' && counter === 0){
        photocontainer.style.transition = 'none';
        counter = photos.length - 2 ;
        photocontainer.style.transform = 'translateX('+ (-size * counter) + 'px)';
    }
});