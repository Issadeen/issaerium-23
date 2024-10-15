// Description: This file contains the code for user authentication and session management.
// Your Firebase configuration
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

document.addEventListener('DOMContentLoaded', (event) => {
    // Get the modal
    var modal = document.getElementById("myModal");

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    // Set timeout for inactivity
    let timeout;
    const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes
    
    let countdown;

    function startTimer() {
        timeout = setTimeout(function() {
            firebase.auth().signOut().then(function() {
                // Sign-out successful, redirect to login page
                window.location.href = "/login";
            }).catch(function(error) {
                // An error occurred.
                console.error('Error during sign out:', error);
            });
        }, INACTIVITY_LIMIT);
    }

    function resetTimer() {
        clearTimeout(timeout);
        startTimer();
        hideWarning();
        clearInterval(countdown);
    }

    function showWarning() {
        // Display warning to user
        modal.style.display = "block";
        console.log('Modal visible');
    }

    function hideWarning() {
        // Hide warning from user
        modal.style.display = "none";
    }

    window.onload = resetTimer;
    document.onmousemove = resetTimer;
    document.onkeypress = resetTimer;

// Check user authentication status
firebase.auth().onAuthStateChanged(function(user) {
    if (!user) {
        // User is not signed in, redirect to index.html
        window.location.href = "/app/login/page";
    } else {
        console.log('User is signed in.');

        // Fetch user data based on workId
        fetchUserData(user);

        // Set the profile picture
        const profilePicElement = document.getElementById('profile-pic');
        profilePicElement.src = user.photoURL || 'default-profile-pic.jpg'; // Default picture if no photo URL
    }
});


    let WARNING_TIME = 2 * 60 * 1000; // 2 minutes
    let countdownTime = WARNING_TIME; // Countdown time starts at WARNING_TIME

    // Show warning 3 minutes before session ends
    setTimeout(() => {
        countdown = setInterval(() => {
            console.log('Countdown before modal warning:', countdownTime / 1000);
            countdownTime -= 1000;
            if (countdownTime <= 0) {
                clearInterval(countdown);
                console.log('Showing modal warning...');
                showWarning();
                if (modal.style.display === "block") {
                    console.log('Modal warning successfully shown.');
                } else {
                    console.log('Failed to show modal warning.');
                }
            }
        }, 1000);
    }, INACTIVITY_LIMIT - WARNING_TIME);

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    function fetchUserWorkId(user) {
        const userId = user.uid;
        const userRef = firebase.database().ref('users/' + userId);
        userRef.once('value').then((snapshot) => {
            const userData = snapshot.val();
            if (userData && userData.workId) {
                currentUserWorkId = userData.workId;
                console.log('User workId fetched:', currentUserWorkId);
                // Trigger a custom event to notify that workId is ready
                document.dispatchEvent(new Event('workIdReady'));
            } else {
                console.error('No workId found for user');
            }
        }).catch((error) => {
            console.error('Error fetching user data:', error);
        });
    }
});

// Function to read user-specific data
window.readUserData = function(callback) {
    if (!currentUserWorkId) {
        console.error('WorkId not available. Ensure user is authenticated.');
        return;
    }

    const dataRef = firebase.database().ref('data/' + currentUserWorkId);
    dataRef.once('value').then((snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        } else {
            callback(null);
        }
    }).catch((error) => {
        console.error('Error reading data:', error);
        callback(null);
    });
}

// Function to save user-specific data
window.saveUserData = function(data, callback) {
    if (!currentUserWorkId) {
        console.error('WorkId not available. Ensure user is authenticated.');
        return;
    }

    const dataRef = firebase.database().ref('data/' + currentUserWorkId);
    const newDataRef = dataRef.push();

    newDataRef.set(data)
        .then(() => {
            console.log('Data saved successfully');
            if (callback) callback(true);
        })
        .catch((error) => {
            console.error('Error saving data:', error);
            if (callback) callback(false);
        });
}

// Function to update existing user-specific data
window.updateUserData = function(key, data, callback) {
    if (!currentUserWorkId) {
        console.error('WorkId not available. Ensure user is authenticated.');
        return;
    }

    const dataRef = firebase.database().ref('data/' + currentUserWorkId + '/' + key);

    dataRef.update(data)
        .then(() => {
            console.log('Data updated successfully');
            if (callback) callback(true);
        })
        .catch((error) => {
            console.error('Error updating data:', error);
            if (callback) callback(false);
        });
}

// Function to delete user-specific data
window.deleteUserData = function(key, callback) {
    if (!currentUserWorkId) {
        console.error('WorkId not available. Ensure user is authenticated.');
        return;
    }

    const dataRef = firebase.database().ref('data/' + currentUserWorkId + '/' + key);

    dataRef.remove()
        .then(() => {
            console.log('Data deleted successfully');
            if (callback) callback(true);
        })
        .catch((error) => {
            console.error('Error deleting data:', error);
            if (callback) callback(false);
        });
}