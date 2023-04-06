//import all modules needed for a phone aut


import { } from "https://www.gstatic.com/firebasejs/6.0.2/firebase.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";





if (window.localStorage.getItem('id') == null) {
    //redirect to the login.html page if the user is not logged in
    window.location.href = "login.html";
}







const firebaseConfig = {
    apiKey: "AIzaSyDp_QjlZP6cah2JBQLIXKSbfKtOIUfZ4Tw",
    authDomain: "cronoescape-ioc.firebaseapp.com",
    databaseURL: "https://cronoescape-ioc-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "cronoescape-ioc",
    storageBucket: "cronoescape-ioc.appspot.com",
    messagingSenderId: "240259839325",
    appId: "1:240259839325:web:20ef18366fd73d2aa2a4b4",
    measurementId: "G-QQD81WK4CE"
};



// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const database = getDatabase(app);









///////////////////////////////////
//LOGOUT METHODS


let logoutButton = document.getElementById("logout-button");
//logout user
if (logoutButton != null) {
    logoutButton.addEventListener('click', (e) => {
        signOut(auth).then(() => {
            // Sign-out successful.
            console.log("logged Out");
            localStorage.clear();
            window.location.href = "login.html";
        }).catch((error) => {
            console.log("error al desloguejar");
        });
    });

}

//FIN LOGOUT METHODS
//////////////////////////////////////////


//////////////////////////////////////////
//USER PROFILE METHODS

let user_uid = window.localStorage.getItem('id');
//retrieve user data from database to display in the user profile

getCurrentUserData(auth);




//function to get the user email from the firebase database
function getCurrentUserData(auth) {
    let currentUser = new Object();
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const uid = user.uid;
            //retrieve data from database
            const dbRef = ref(database, 'users/' + user.uid);
            get(dbRef).then((snapshot) => {
                if (snapshot.exists()) {

                    currentUser = {
                        user_uid: uid,
                        dateOfCreation: snapshot.val().dateOfCreation.toString(),
                        email: snapshot.val().email.toString(),
                        last_login: snapshot.val().last_login.toString(),
                        oldUserUID: snapshot.val().oldUserUID.toString(),
                        phone: snapshot.val().phone.toString(),
                        userName: snapshot.val().userName.toString(),
                        user_IP: snapshot.val().user_IP.toString()

                    }
                    //si la url no conté joc.html carrega les dades de l'usuari i els jocs, si conté joc.html carrega el joc
                    if (!window.location.href.includes("/joc.html")) {
                        renderUserData(currentUser);
                        renderUserGames(currentUser);
                        return;
                    }

                    searchGame(currentUser);






                } else {
                    console.log("No data available");
                }
            }).catch((error) => {
                console.error(error);
            });



        }


    });



}

//ESTA FUNCION PINTA LOS DATOS DEL USUARIO EN EL PERFIL

function renderUserData(currentUser) {
    document.getElementById("userName-container").innerHTML += ` ${currentUser.userName}`
    document.getElementById("userName").innerHTML += ` ${currentUser.userName} no es el Teu nom d'usuari?`
    //todo pintar ownGames(currentUser).length


}



//FIN USER PROFILE METHODS
//////////////////////////////////////////





/////////////////////////////////////////
//HTTP REQUEST METHODS


//function to make an http request to the URL and return the response
function httpRequest(url) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', url, false);
    httpRequest.send();
    if (httpRequest.status === 200) {
        return httpRequest.responseText;
    } else {
        return null;
    }
}

//function to check if the data exists in the database
function dataExists(url) {
    let data = httpRequest(url);
    if (data != "null") {
        return true;
    } else {
        return false;
    }
}


//FIN HTTP REQUEST METHODS
//////////////////////////////////////////

/////////////////////////////////////////
//GAME METHODS

let PlayButton = document.getElementById("game-start");
if (PlayButton != null) {
    PlayButton.addEventListener('click', (e) => {
        window.location.href = "joc.html";

    });
}


/**funció searchGame(currentUser)
**busca si existeixen jocs per l'usuari actual, si no existeixen crea un nou joc i el carrega, 
**si existeixen carrega el joc amb checkpoint que no sigui 999(finalitzat), si tots els jocs estan finalitzats crea un nou joc i el carrega**/

function searchGame(currentUser) {
    console.log("Buscant joc");
    let ownGames = getOwnGames(currentUser);
    //si no existeixen jocs crea un nou joc i el pushea a la bd després carrega directament el checkpoint -1(sense inicialitzar)
    if (ownGames.length == 0) {
        console.log("creating first game");
        createGame(currentUser, 0);
        loadGame(currentUser.user_uid+"1", -1);
        return;
    }
    

    //per cada joc a ownGames mira si te checkpoint diferent de 999(finalitzat) llavors carrega el joc
    for (let game in ownGames) {
        if (ownGames[game].checkpoint != 999) {
            
            console.log("game found")
            
            let currentCheckpoint = ownGames[game].checkpoint;
            
            loadGame(currentUser.user_uid + ownGames[game].gameid, currentCheckpoint);
            return;
        }

    }
    //nomes arriva aqui si existeixen jocs pero no hi ha cap joc amb checkpoint diferent de 999(finalitzat)
    console.log("creating next game");
    let gameID = currentUser.user_uid + "" + (ownGames.length + 1);
    createGame(currentUser, ownGames.length);
    loadGame(gameID, -1);

}



//crea un nou game amb id = currentUser.user_uid+(ownGames.length+1) i checkpoint = -1 (sense inicialitzar)
function createGame(currentUser, ownGameslength) {
    let gameID = parseInt(ownGameslength) + 1;
    let uid = currentUser.user_uid + gameID.toString();

    let game = {
        game_uid: uid,
        checkpoint: `${-1}`,
        duracion: "null",
        fechaFin: "null",
        fechaInicio: getCurrentDate(),
        gameid: gameID,
        userName: currentUser.userName,
        user_ip: currentUser.user_IP,
        useruid: currentUser.user_uid
    }

    console.log("enregistrant joc a la base de dades");
    //enregistra el new game a la base de dades de games
    set(ref(database, 'games/' + game.game_uid), {
        checkpoint: game.checkpoint,
        duracion: game.duracion,
        fechaFin: game.fechaFin,
        fechaInicio: game.fechaInicio,
        gameid: game.gameid,
        userName: game.userName,
        user_ip: game.user_ip,
        useruid: game.useruid
    })






    console.log("joc enregistrat a la base de dades");


};

//carrega el joc amb el checkpoint especificat, carrega les variables a utilizar en el HTML
function loadGame(gameID, checkPoint) {

    localStorage.setItem("checkPoint", checkPoint);
    localStorage.setItem("gameID", gameID);

}








function renderUserGames(user) {
    let ranking = getOwnGames(user);
    //function to get ownRanking(user) entries inside ranking variable were ownRanking[i].duracion == null(no finalitzat) are removed and rendered
    for( let i = 0; i < ranking.length; i++){ 
                                   
        if ( ranking[i].fechaFin == "null") { 
            ranking.splice(i, 1); 
            i--; 
        }
    }
    
    
    
    
    //sort ranking by time   

    ranking.sort(function (a, b) {
        let aTime = a.duracion.split(":");
        let bTime = b.duracion.split(":");
        let aSeconds = (+aTime[0]) * 60 * 60 + (+aTime[1]) * 60 + (+aTime[2]);
        let bSeconds = (+bTime[0]) * 60 * 60 + (+bTime[1]) * 60 + (+bTime[2]);
        return aSeconds - bSeconds;
    });

    let gamesContainer = document.getElementById("gamesContainer");

    let userName;
    let duracion;

    let htmlRanking = "";

    //games container innerHTML has a table with userName, duracion 
    htmlRanking +=
        `<table class="table table-striped">
      <thead>
        <tr>
          <th scope="col">Posició</th>
          <th scope="col">Usuari</th>
          <th scope="col">Temps</th>
        </tr>
      </thead>
      <tbody>`;


    //renders all ranking entries in the gamesContainer div
    for (let game in ranking) {

        userName = ranking[game].userName;
        duracion = ranking[game].duracion;
        //create an entry on the table with id "rankingTable" adding a th with the userName, duracion 
        htmlRanking += `
      <tr>
        <th scope="row">${parseInt(game) + 1}</th>
        <td>${userName}</td>
        <td>${duracion}</td>
      </tr>`;

    }
    htmlRanking +=
        ` </tbody>
  </table>`

    gamesContainer.innerHTML += htmlRanking;

}


//gets all the games from the database and returns them in an array of objects
function getOwnGames(user) {
    let url = `${firebaseConfig.databaseURL}/games/.json`;
    let response = httpRequest(url);
    let jsonGames = JSON.parse(response);
    let ownGames = [];
    //console log all of the attribute gameid of the games in the database
    for (let game in jsonGames) {
        let gameUrl = `${firebaseConfig.databaseURL}/games/${game}/.json`;

        let gameObj = JSON.parse(httpRequest(gameUrl));

        if (gameObj.useruid == user.user_uid || gameObj.useruid == user.oldUserUID) {
            ownGames.push(gameObj);
        }


    }
    return (ownGames);
};
//FIN GAME METHODS


// CALCUL TEMPS JOC

// Funció per obtenir la data actual.
function getCurrentDate() {
    const currentDate = new Date().getTime();
    return currentDate;
}


/*
   // Variable per guardar la data d'inici del joc.
let startDate;
// Variable per guardar el temps transcorregut si l'usuari surt sense finalitzar el joc.
let dataSensefi;
// Variable per guardar la data de fí del joc.
let endDate;

// Si l'usuari torna a jugar a un joc que ja s'havia iniciat, el seu nou "startDate" serà la variable "dataSensefi".
if (dataSensefi) {
    startDate = dataSensefi;
} else {
    // Quan l'usuari clica al botó "jugar", s'obté la data actual i es guarda com a "startDate".
    startDate = getCurrentDate();
}

// Quan l'usuari entra a la pàgina "final.html", s'obté una nova data i es guarda com a "endDate".
endDate = getCurrentDate();
*/



// Funció per calcular el temps empleat jugant accepta 2 parametres en milisegons startDate.getTime() i endDate.getTime().
function tempsTotal(startDate, endDate) {
    const calculTemps = endDate - startDate; // Diferència en milisegons.
    const tempsSegons = calculTemps / 1000; // Convertim a segons.
    const hores = Math.floor(tempsSegons / 3600); // Convertim a hores.
    const minuts = Math.floor((tempsSegons - (hores * 3600)) / 60); // Convertim a minuts.
    const segons = Math.floor(tempsSegons - (hores * 3600) - (minuts * 60)); // Convertim a segons.
    //retorna un string amb el temps total en format "HH:MM:SS"
    return `${hores}:${minuts}:${segons}`;
}

// Funció per convertir de date a string "HH:MM:SS".
function dateToString(date) {
    const hores = date.getHours();
    const minuts = date.getMinutes();
    const segons = date.getSeconds();
    return `${hores}:${minuts}:${segons}`;
}

// Funció per convertir de string "HH:MM:SS" a date en milisegons.
function stringToDate(str) {
    const [hores, minuts, segons] = str.split(':');
    const date = new Date();
    date.setHours(hores);
    date.setMinutes(minuts);
    date.setSeconds(segons);
    return date;
}



