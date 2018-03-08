const listI =  require('../listIndex.hbs');
let myMap, clusterer, myPlacemark = [], myList = {list:[]}, name, address, balloonText, dateForm, coords;

// Создание метки.
function createPlacemark(coords) {
    return new ymaps.Placemark(coords, {
        iconCaption: 'поиск...',
        name: name,
        address: address,
        description: balloonText,		
        date: dateForm
    }, {
        preset: 'islands#violetStretchyIcon',
        draggable: false
    });
}

// Определяем адрес по координатам (обратное геокодирование).
function getAddress(coords) {
    myPlacemark.properties.set('iconCaption', 'поиск...');
    ymaps.geocode(coords).then(function (res) {
        var firstGeoObject = res.geoObjects.get(0);
        myPlacemark.properties
            .set({
                // Формируем строку с данными об объекте.
                iconCaption: [
                    // Название населенного пункта или вышестоящее административно-территориальное образование.
                    firstGeoObject.getLocalities().length ? firstGeoObject.getLocalities() : firstGeoObject.getAdministrativeAreas(),
                    // Получаем путь до топонима, если метод вернул null, запрашиваем наименование здания.
                    firstGeoObject.getThoroughfare() || firstGeoObject.getPremise()
                ].filter(Boolean).join(', '),
                // В качестве контента балуна задаем строку с адресом объекта.
                balloonContent: firstGeoObject.getAddressLine()
            });
    });
}

function getAddressNew(coords) {
    ymaps.geocode(coords).then(function (res) {
        var firstGeoObject = res.geoObjects.get(0).properties._data.text;
        myModuleMap.newAddressForm(firstGeoObject); 
    });
}

function getClickPosition(x, y) {
    myModuleMap.mod.style = "display: block; position: absolute; left:" + x + "px; top:" + y + "px";
}

function setPositionModal(e){
    //получить координаты мышки на экране
    var x = (event.layerX == undefined ? event.offsetX : event.pageX) + 1;
    var y = (event.layerY == undefined ? event.offsetY : event.pageY) + 1;
    getClickPosition(x, y);
}

function getFormattedDate(){
    var d = new Date();
    d = d.getFullYear() + "." + ('0' + (d.getMonth() + 1)).slice(-2) + "." + ('0' + d.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
    return d;
}

const myModuleMap = {
    commentList: document.querySelector('.comment__list'),
    closeForm: document.querySelector('.modal__title-close'),
    mod: document.querySelector('.modal'),
    addressForm: document.querySelector('.modal__title-name'),
    subForm: document.getElementById('marker_sub'),
    myMapSearch: function (){
        // Слушаем клик на карте.
        myMap.events.add('click', function (e) {
            coords = e.get('coords');
            // Если метка уже создана
            if (myPlacemark) {
                coords = e.get('coords');
                setPositionModal(e);
            }     
            getAddressNew(coords);   
        });
        myMap.geoObjects.events.add('click', function (e) {
            e.preventDefault();            
            myList = {list:[]};
            var object = e.get('target').properties._data;
            if(object.geoObjects){
                object.geoObjects.forEach(function(element) {
                    myList.list.push({
                        name: element.properties._data.name,
                        address: element.properties._data.address,
                        description: element.properties._data.description,	
                        date: element.properties._data.date,	
                    })
                }, this);
                myModuleMap.commentList.innerHTML = listI(myList);
            }else{
                myList.list.push({
                    name: object.name,
                    address: object.address,
                    description: object.description,	
                    date: object.date,	
                })
                myModuleMap.commentList.innerHTML = listI(myList);
                setPositionModal(e);
            }            
        });
    },
    loadMap: function(){
        return new Promise(resolve => ymaps.ready(resolve)) 
            .then(points => {
                // Создаем собственный макет с информацией о выбранном геообъекте.
                var customItemContentLayout = ymaps.templateLayoutFactory.createClass(
                    // Флаг "raw" означает, что данные вставляют "как есть" без экранирования html.
                    '<strong class=ballon_header>{{ properties.address|raw }}</strong></br>' +
                    '<div class=ballon_body><a href="#" class="ballon_click">{{ properties.iconCaption|raw }}</a></br>{{ properties.description|raw }}</div>' +
                    '<div class=ballon_footer>{{ properties.balloonContentFooter|raw }}</div>'
                );
                myMap = new ymaps.Map('map', {
                    center: [55.76, 37.64], // Москва
                    zoom: 10
                }, {
                    searchControlProvider: 'yandex#search'
                });
                clusterer = new ymaps.Clusterer({
                    preset: 'islands#invertedVioletClusterIcons',
                    clusterDisableClickZoom: true,
                    openBalloonOnClick: true,
                    // Устанавливаем стандартный макет балуна кластера "Карусель".
                    clusterBalloonContentLayout: 'cluster#balloonCarousel',
                    // Устанавливаем собственный макет.
                    clusterBalloonItemContentLayout: customItemContentLayout,
                    // Устанавливаем режим открытия балуна. 
                    // В данном примере балун никогда не будет открываться в режиме панели.
                    clusterBalloonPanelMaxMapArea: 0,
                    // Устанавливаем размеры макета контента балуна (в пикселях).
                    clusterBalloonContentLayoutWidth: 200,
                    clusterBalloonContentLayoutHeight: 130,
                    // Устанавливаем максимальное количество элементов в нижней панели на одной странице
                    clusterBalloonPagerSize: 5
                });
                myMap.geoObjects.add(clusterer);
                this.myMapSearch();
            })
            .catch(e => alert('Ошибка: ' + e.message));
    },
    geocode: function (address) {
        return ymaps.geocode(address)
            .then(result => {
                const points = result.geoObjects.toArray();
    
                if (points.length) {
                    return points[0].geometry.getCoordinates();
                }
            });
    },
    init: function () {
        this.loadMap();
    },
    getValueForm: function(){
        name = document.getElementById("marker_name").value;
        address = document.getElementById("marker_address").value;
        balloonText = document.getElementById("marker_balloontext").value;
        dateForm = getFormattedDate();
    },
    removeValueForm: function(){
        document.getElementById("marker_name").value = "";
        document.getElementById("marker_address").value = "";
        document.getElementById("marker_balloontext").value = "";
        myModuleMap.commentList.innerHTML = "Отзывов пока нет...";
    },
    newAddressForm: function(e){
        this.addressForm.innerHTML = e;
        myModuleMap.commentList.innerHTML = "Отзывов пока нет...";
    }
}

myModuleMap.closeForm.addEventListener('click', function(){
    myModuleMap.mod.removeAttribute('style');
});

myModuleMap.subForm.addEventListener('click', function(e){
	myModuleMap.getValueForm();
    myPlacemark = createPlacemark(coords);
    //добавляем в группировку
    clusterer.add(myPlacemark);
    getAddress(coords);
    myModuleMap.mod.removeAttribute('style');
    myModuleMap.removeValueForm();
});

$(document).on('click' ,'.ballon_click', function (e) {
    e.preventDefault();
    setPositionModal(e);
});

window.onload = myModuleMap.init();