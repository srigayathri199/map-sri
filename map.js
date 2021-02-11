'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class workout {
    date = new Date();
    id = Date.now() + ''.slice(-10);
    click = 0;
    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance; //in kms
        this.duration = duration; //in min
    };
    _setdescription() {
        //prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]}  ${this.date.getDate()}`;
    }
    _clicks() {
        this.click++;
    }
};
class running extends workout {
    type = 'running';
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcpace();
        this._setdescription();
    };
    calcpace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
};
class cycling extends workout {
    type = 'cycling';
    constructor(coords, distance, duration, elevationgain) {
        super(coords, distance, duration);
        this.elevationgain = elevationgain;
        this.calcspeed();
        this._setdescription();

    }
    calcspeed() {
        this.speed = this.distance / (this.duration / 60); //in hrs
        return this.speed;
    }
};




//here,map and mapevent made private in app class but in this chrome,its still in progress but when set to private, we need to set "this" to app class by using bind method wherever we use those map,mapevent ,but i still used bind even it is not private.

// let map, mapevent;
let workoutobj;

class App {
    // #map;
    // #mapevent;
    map;
    mapevent;
    //this should be private,but
    activities = [];
    mapzoomlevel = 13;
    constructor() {
        //as constr does not take any values,obj created for App,does not have any except public fields(activities)

        //get users position
        this._getPosition();


        //get data from local storage
        this._getlocalstorage();

        //Attach event handlers
        form.addEventListener('submit',
            this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._movetopopup.bind(this));
    }

    _getPosition() {
        //geolocation-2 args, 1 fn->if no error,2 fn->if error
        // console.log(navigator);
        console.log(this);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function() {
                alert('we could not acces your location');
            })
        }
    };
    _loadMap(position) {
        console.log(position);
        const { latitude, longitude } = position.coords;
        // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

        //L is a built-in namespace obj,13 is the zoom number
        // console.log(L);
        this.map = L.map('map').setView([latitude, longitude], this.mapzoomlevel);
        // console.log(map); //is an obj

        //tiles are the boxes appear when refreshed,and have map different appearing  styles
        //create tile and add to map
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        L.marker([latitude, longitude]).addTo(this.map)
            .bindPopup(L.popup({
                maxWidth: 500,
                minWidth: 100,
                autoClose: false,
                className: `leaflet-popup`,
                closeOnClick: false
            })).setPopupContent(`you are here`)
            .openPopup();

        //event listener on map-"on"
        this.map.on('click', this._showForm.bind(this));

        //workouts stored in loacl storage should have markers,popup when the page is loaded at first and also the map is loaded, so we should add markers here
        this.activities.forEach(work => {
            this._renderworkoutmarket(work);
        });
    };
    _showForm(mape) {
        // console.log(mape.latlng);
        this.mapevent = mape;
        // console.log(mapevent);
        form.classList.remove('hidden');
        inputDistance.focus();
    };
    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }
    _newWorkout(e) {
        //returns true only if all inputs satisfy
        const validinputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));

        const allpositive = (...inputs) => inputs.every(inp => inp > 0);

        e.preventDefault();
        // console.log(this);

        //get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.mapevent.latlng;

        //if workout is running, create running obj
        if (type === 'running') {
            const cadence = +inputCadence.value;
            //check data is valid
            if (!validinputs(distance, duration, cadence) || !allpositive(distance, duration, cadence)) {
                return alert('inputs should be a positive number.');
            }
            //add/push new obj to activities array
            workoutobj = new running([lat, lng], distance, duration, cadence);
            this.activities.push(workoutobj);
        }
        //if workout is cycling, create cycling obj
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            //check data is valid
            if (!validinputs(distance, duration, elevation) || !allpositive(distance, duration)) {
                return alert('inputs should be a positive number.');
            }
            //add/push new obj to activities array
            workoutobj = new cycling([lat, lng], distance, duration, elevation);
            this.activities.push(workoutobj);
            // console.log(workoutobj);
        }

        //render workout on map as marker
        this._renderworkoutmarket(workoutobj);

        //render workout on list
        this._renderworkoutlist(workoutobj);


        //hide form + clear input fields
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = inputType.value = '';
        //setting form "none" / removing form
        form.style.display = 'none';
        //but here, remving the class 'hidden' , and again adding when click on map
        form.classList.add('hidden');
        //set back to "grid"
        setTimeout(() => form.style.display = 'grid', 1000);


        //store workout to local storage
        this._setlocalstorage();
    };


    _renderworkoutmarket(workoutt) {
        //popup on location-create a marker,add to map,create popup and open
        L.marker(workoutt.coords).addTo(this.map).bindPopup(L.popup({
            maxWidth: 550,
            minWidth: 100,
            autoClose: false,
            className: `${workoutt.type}-popup`,
            closeOnClick: false
        })).setPopupContent(`${workoutt.type === 'running' ?'🏃':'🚴‍♀️'} ${workoutt.description}`).openPopup();
    }
    _renderworkoutlist(workoutt) {
        let html = ` <li class="workout workout--${workoutt.type}" data-id="${workoutt.id}">
        <h2 class="workout__title">${workoutt.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workoutt.type === 'running' ?'🏃':'🚴‍♀️'}</span>
          <span class="workout__value">${workoutt.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workoutt.duration}</span>
          <span class="workout__unit">min</span>
        </div>`;

        if (workoutt.type === 'running')
            html += `
        <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workoutt.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workoutt.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>`;

        if (workoutt.type === 'cycling')
            html +=
            `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workoutt.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workoutt.elevationgain}</span>
      <span class="workout__unit">m</span>
    </div>`;

        //inserting as a sibling at the end of the form 
        form.insertAdjacentHTML('afterend', html);
    };

    _movetopopup(e) {
        const movel = e.target.closest('.workout');
        // console.log(movel);
        if (!movel) return;
        const workouts = this.activities.find(work => work.id === movel.dataset.id);
        console.log(workouts);
        // console.log(this.mapzoomlevel);
        this.map.setView(workouts.coords, this.mapzoomlevel, {
            animate: true,
            pan: {
                duration: 1,
            }
        });
        // workoutobj._clicks();
    };

    //stores to local storage
    //"stringify" converts obj to string
    _setlocalstorage() {
        localStorage.setItem('workouts', JSON.stringify(this.activities));
    }

    //as it should display when webpage loads,it should be in "app" constructor
    //converting back to obj to store in array
    _getlocalstorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        console.log(data);

        if (!data) return;

        //when we reload, there is no data in activities array, we need to set previous workouts in activities
        this.activities = data;

        this.activities.forEach(work => {
            this._renderworkoutlist(work);
        });
    }

    //first public  method in app class
    reset() {
        localStorage.removeItem('workouts');
        //reload
        location.reload();

    }
}
const app = new App();


//when we convert objs to strings and vice versa using stringify and parse, the strings/ob loose their prototypes, thats y "click" fn shows error
// to fix this,we need to loop the  "data" created in localstorage and then restore objs by creating a new obj using the class based on the data coming here from loacl storage