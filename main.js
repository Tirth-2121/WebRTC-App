let peerconnection;
let localstream;
let remotestream;

let isAudioMuted = false;

// Function to check for camera and mic permissions
function checkPermissions() {
    // Try to access the camera and microphone
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            // Permissions are granted, stop the stream to release the resources
            stream.getTracks().forEach(track => track.stop());
            console.log("Camera and microphone permissions granted.");
        })
        .catch((error) => {
            // If permissions are denied or there is an error
            alert("Camera or microphone permissions are not granted.");
            checkPermissions();
        });
}

checkPermissions();

document.getElementById("mute-btn").addEventListener("click", () => {
  localstream.getAudioTracks().forEach((track) => {
    track.enabled = !track.enabled;  // Mute/Unmute audio
  });

  isAudioMuted = !isAudioMuted;

  // Change button text and icon
  const muteBtn = document.getElementById("mute-btn");
  muteBtn.innerHTML = isAudioMuted 
    ? '<i class="fas fa-microphone-slash"></i> Unmute' 
    : '<i class="fas fa-microphone"></i> Mute';
});

let servers = {
  iceServers: [
    {
      urls: ["stun:stun1.1.google.com:19302", "stun:stun2.1.google.com:19302"],
    },
  ],
};

let init = async () => {
  localstream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  document.getElementById("user-1").srcObject = localstream;
};

let createPeerConnection = async (sdpType) => {
  peerconnection = new RTCPeerConnection(servers);

  remotestream = new MediaStream();
  document.getElementById("user-2").srcObject = remotestream;

  localstream.getTracks().forEach((track) => {
    peerconnection.addTrack(track, localstream);
  });

  peerconnection.ontrack = async (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remotestream.addTrack(track);
    });
  };

  peerconnection.onicecandidate = async (event) => {
    if (event.candidate) {
      document.getElementById(sdpType).value = JSON.stringify(
        peerconnection.localDescription
      );
    }
  };
};

let createOffer = async () => {
  createPeerConnection("offer-sdp");
  let offer = await peerconnection.createOffer();
  await peerconnection.setLocalDescription(offer);

  document.getElementById("offer-sdp").value = JSON.stringify(offer);

  document.getElementById('create-answer').style.display = 'none'
};

let createAnswer = async () => {
  createPeerConnection("answer-sdp");

  let offer = document.getElementById("offer-sdp").value;

  if (!offer) {
    return alert("first retrieve offer from peer...");
  }

  offer = JSON.parse(offer);
  await peerconnection.setRemoteDescription(offer);

  let answer = await peerconnection.createAnswer();
  await peerconnection.setLocalDescription(answer);

  document.getElementById("answer-sdp").value = JSON.stringify(answer);

  document.getElementById("add-answer").style.display = 'none';

};

let answer = async () => {
  let answer = document.getElementById("answer-sdp").value;
  if (!answer) {
    return alert("first retrieve answer from peer...");
  }
  answer = JSON.parse(answer);

  if (!peerconnection.currentRemoteDescription) {
    peerconnection.setRemoteDescription(answer);
  }
};

init();

document.getElementById("create-offer").addEventListener("click", createOffer);
document.getElementById("create-answer").addEventListener("click", createAnswer);
document.getElementById("add-answer").addEventListener("click", answer);
document.getElementById("hangup-btn").addEventListener("click", () => {
  location.reload(); 
});
