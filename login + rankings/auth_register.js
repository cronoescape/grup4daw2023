//import all modules needed for a phone aut

import { } from "https://www.gstatic.com/firebasejs/6.0.2/firebase.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getDatabase, ref, set, update } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";



//redirect to the user_profile.html page if the user is already logged in
let user_uid = window.localStorage.getItem('id');
if (user_uid != null) {
    window.location.href = "user_profile.html";

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


//create user object to store the data to be pushed to the database
let user = {
    email: "",
    userIP: "",
    number: "",
    userName: "",
    password: "",

    oldUserUID: null,
    playedGames: 0,
};



render();
let sendCodeButton = document.getElementById('sendCode');
let verifyCodeButton = document.getElementById('verifyCode');
sendCodeButton.addEventListener('click', sendCode);
verifyCodeButton.addEventListener('click', verifyCode);




//render the captcha onload
function render() {
    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container');
    recaptchaVerifier.render();
}


function setUserInfo(user) {

    user.email = document.getElementById('email').value;
    user.userIP = getUserIP();
    user.number = document.getElementById('number').value;
    user.userName = document.getElementById('userName').value;
    user.password = document.getElementById('password').value;

}

function sendCode() {


    //when sendcode is clicked then we set up the user info
    setUserInfo(user);
    let repeatPassword = document.getElementById('repeatPassword').value;

    //check if the password is the same
    if (user.password != repeatPassword) {
        alert("Password not the same");
        return;
    }

    if(userNameNotValid(user.userName)){
        alert("El nom d'usuari no es valid, ha de tenir entre 3 i 15 caracters i no pot contenir caracters especials");
        return;
    }


    //check if the user has entered all the fields
    if (user.email == "" || user.number == "" || user.userName == "" || user.password == "" || repeatPassword == "") {
        alert("Sisplau empleneu tots els camps");
        return;
    }

    //check if field strings are containing spacebars
    if (user.email.includes(" ") || user.number.includes(" ") || user.password.includes(" ") || repeatPassword.includes(" ")) {
        alert("Els espais no son valids als camps de email, telefon i contrasenya");
        return;
    }




    //phone needs to start by 6 or 7 and have 9 numbers in total.
    if (phoneNotValid(user.number)) {
        alert(user.number + ", el numero de telefon no es valid, ha de començar per 6 o 7 i tenir 9 numeros en total");
        return;
    }

    //email needs to have @ and .com or .es or .org or .net
    if (emailNotValid(user.email)) {
        alert("El email no es valid, ha de tenir ser com aquest: email@domini.com");
        return;
    };
    //check if the phone or email already exists in the database
    if (phoneExists(user.number)) {

        alert("Telèfon o email no disponible");
        return;
    };

    //check if email exists
    if (emailExists(user.email)) {
        alert("Telèfon o email no disponible");
        return;
    }

    //if ip exists then we search the old user uid and we set it to the user object
    if (ipExists(user.userIP)) {
        user.oldUserUID = getOldUserUID(user.userIP);
    };

    phoneAuth("+34" + user.number);

}

//ENDS OF SECURITY METHODS
////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////
//STARTS OF AUTH METHODS

function verifyCode() {
    let code = document.getElementById('verificationCode').value;

    codeverify(code, auth, database);
}



function phoneAuth(number) {
    //phone number authentication function of firebase
    //it takes two parameter first one is number,second one is recaptcha
    firebase.auth().signInWithPhoneNumber(number, window.recaptchaVerifier)
        .then(function (confirmationResult) {
            //s is in lowercase
            window.confirmationResult = confirmationResult;
            window.coderesult = confirmationResult; // assign confirmationResult to coderesult variable
            alert("Message sent");
        }).catch(function (error) {
            alert(error.message);
        });
}

function codeverify(code, auth, database) {
    //code verification function of firebase
    window.coderesult.confirm(code).then((e) => {
        // User signed in successfully.


        let number = user.number;
        let email = user.email;
        let userIP = user.userIP;
        let password = user.password;
        let userName = user.userName;
        let oldUserUID = getOldUserUID(userIP);


        //createUserwithemailandpasword pushing the previous data to the database 
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed in
                const user = userCredential.user;

                // ... user.uid
                set(ref(database, 'users/' + user.uid), {
                    email: email,
                    user_IP: userIP,
                    phone: number,
                    userName: userName,
                    oldUserUID: oldUserUID,
                    dateOfCreation: new Date().toLocaleString(),
                })
                //replace . and @ with "" to avoid errors
                let formatEmail = email.replace(/\./g, '');
                formatEmail = formatEmail.replace(/\@/g, '');
                let formatIP = userIP.replace(/\./g, '');

                set(ref(database, 'phones/' + number), {
                    phone: true,
                })
                set(ref(database, 'emails/' + formatEmail), {
                    email: true,
                })
                set(ref(database, 'ips/' + formatIP), {
                    ip: userIP,
                    user_id: user.uid,
                })
                    .then(() => {

                        // Data saved successfully!
                        alert("Successfully registered");
                        login(auth, email, password);
                        console.log(email, password);
                    })
                    .catch((error) => {

                        // The write failed...
                        //capture the div class login-container and append the error message in red
                        console.log(error);
                    });
            })
            .catch((error) => {

                //const errorCode = error.code;
                const errorMessage = error.message;
                // ..
                alert(errorMessage);
            });
    }).catch(function (error) {

        alert(error.message);
    });
}





//END OF AUTH METHODS
///////////////////////////////////







///////////////////////////////////
//LOGIN/LOGOUT METHODS
function login(auth, emailLogin, passwordLogin) {

    signInWithEmailAndPassword(auth, emailLogin, passwordLogin)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            // ...

            // save log in details into real time database
            let lgDate = new Date();
            update(ref(database, 'users/' + user.uid), {
                last_login: lgDate,
            })
                .then(() => {
                    // Data saved successfully!
                    console.log(user.uid + ' user logged in successfully');
                    //save the token in the local storage
                    window.localStorage.setItem('id', user.uid);

                    //redirects to user_profile.html
                    window.location.href = "user_profile.html";

                })
                .catch((error) => {
                    // The write failed...
                    alert(error);
                });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            alert(errorMessage);
        });
}
//logout user
let logoutButton = document.getElementById("logout-button");
if (logoutButton != null) {
    logoutButton.addEventListener('click', (e) => {
        signOut(auth).then(() => {
            // Sign-out successful.
            console.log("logged Out");
            window.localStorage.removeItem('id');
            window.location.href = "user_profile.html";
        }).catch((error) => {
            // An error happened.
        });
    });



}

//FIN LOGIN LOGOUT METHODS
//////////////////////////////////////////



/////////////////////////////////////////
//PHONE METHODS



//function to check if the phone number is valid should be a string of 9 numbers and start with 6 or 7
function phoneNotValid(phone) {
    return (!/^[6-7][0-9]{8}$/.test(phone));
}



//function to check if the phone number already exists in the database
function phoneExists(phone) {
    let url = `${firebaseConfig.databaseURL}/phones/${phone}/.json`;
    return dataExists(url);
}

//FIN PHONE METHODS
//////////////////////////////////////////


//////////////////////////////////////////
//EMAIL   METHODS

//function to check if the email already exists in the database
function emailExists(email) {

    //replace the dots and @ in the email with nothing
    email = email.replace(/\./g, '');
    email = email.replace(/\@/g, '');
    //checks on the database doing an httprequest
    let url = `${firebaseConfig.databaseURL}/emails/${email}/.json`;
    return dataExists(url);
}


//function to check if an email is not valid with regex
function emailNotValid(email) {
    return !(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email));
}


//FIN EMAIL methods
//////////////////////////////////////////


/////////////////////////////////////////
//IP methods
//function to return the current user IP from api ipify using httpRequest
function getUserIP() {
    var httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', 'https://api.ipify.org?format=json', false);
    httpRequest.send();
    if (httpRequest.status === 200) {
        return JSON.parse(httpRequest.responseText).ip;
    }
}


//get id from IP
//function to get the old user UID from the database by the IP
//function to get the old user UID from the database by the IP
function getOldUserUID(ip) {
    ip = ip.replace(/\./g, "");

    let url = `${firebaseConfig.databaseURL}/ips/${ip}/user_id/.json`;

    return httpRequest(url).replace(/"/g, '');


}


function ipExists(ip) {

    ip = ip.replace(/\./g, '');
    let url = `${firebaseConfig.databaseURL}/ips/${ip}/.json`;
    return dataExists(url);
}


//FIN IP METHODS
//////////////////////////////////////


//////////////////////////////////////
//USER NAME METHODS
function userNameNotValid(userName) {
    //username must be between 3 and 15 characters and cant contain special characters
    return !(/^[a-zA-Z0-9]{3,15}$/.test(userName));
}










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