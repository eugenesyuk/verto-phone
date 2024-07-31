const UI = {
  state: $(state),
  connectButton: $(connectButton),
  hangupButton: $(hangupButton),
  disconnectButton: $(disconnectButton),
  callState: $(callState),
  callStateText: $(callStateText),
  callControls: $(callControls),
  targetInput: $(targetInput),
  callButton: $(callButton),
  incomingCallDialog: $(incomingCallDialog),
  incomingCallNumber: $(incomingCallNumber),
  closeDialogButton: $(closeDialogButton),
  answerCallButton: $(answerCallButton),
  declineCallButton: $(declineCallButton),
  dtmfButtons: $('.dtmfButton'),
  transferButton: $(transferButton),
  muteCheckbox: $(muteCheckbox),
  holdCheckbox: $(holdCheckbox)
};

let verto = null;
let currentCall = null;

const callbacks = {
  onDialogState: (call) => {
    currentCall = call;

    switch (call.state.name) {
      case 'trying':
        UI.callStateText.text('Trying...');
        UI.callState.show();
        break;
      case 'ringing':
        currentCall = call;
        const { callee_id_number, caller_id_number } = call.params
        const number = callee_id_number || caller_id_number || 'Unidentified'
        showIncomingCall(number);
        UI.callStateText.text('Ringing...');
        UI.callState.show();
        break;
      case 'answering':
        UI.callStateText.text('Answering...');
        closeIncomingCall();
        break;
      case 'active':
        UI.callControls.show();
        UI.callStateText.text('Active');
        break;
      case 'hangup':
        closeIncomingCall();
        UI.callStateText.text("Call ended with cause: " + call.cause);
        break;
      case 'destroy':
        UI.callControls.hide();
        break;
    }
  },
  onWSLogin: (v, success) => {
    if (!success) {
      UI.state.text('Authorization failed');
      UI.toggleVertophone.prop('disabled', true);
    }
  },
  onMessage: (verto, dialog, message, data) => {
    const { name } = message;

    switch (name) {
      case 'clientReady':
        UI.state.text('Connected succesfully');
        UI.callButton.prop('disabled', false);
        UI.targetInput.prop('disabled', false);
        UI.disconnectButton.prop('disabled', false);
        break;
      default:
        break;
    }
  },
  onWSClose: (v, success) => {
    UI.state.text('Disconnected');
    UI.callButton.prop('disabled', true);
    UI.targetInput.prop('disabled', true);
    UI.disconnectButton.prop('disabled', true);
  },
};

const bootstrap = () => {
  verto = new jQuery.verto({
    login: `${loginInput.value}@${serverInput.value}`,
    passwd: `${passwordInput.value}`,
    socketUrl: `wss://${serverInput.value}:${portInput.value}`,
    deviceParams: {
      useMic: 'any',
      useSpeak: 'any',
      useCamera: 'none',
    },
    tag: 'remoteAudio',
    audioParams: {
      googAutoGainControl: false,
      googNoiseSuppression: false,
      googHighpassFilter: false,
    },
    iceServers: true,
    ringSleep: 500,
    sessid: null,
  }, callbacks);

  // for debug
  window.verto = verto;
}

const hangupCall = () => {
  if (currentCall) currentCall.hangup();
};

const makeCall = () => {
  currentCall = verto.newCall({
    // Extension to dial.
    destination_number: UI.targetInput.val(),
    caller_id_name: 'Caller Id Name',
    caller_id_number: 'Caller Id Number',
    outgoingBandwidth: 'default',
    incomingBandwidth: 'default',
    // Enable stereo audio.
    useStereo: true,
    // Set to false to disable inbound video.
    useVideo: false,
    // You can pass any application/call specific variables here, and they will
    // be available as a dialplan variable, prefixed with 'verto_dvar_'.
    userVariables: {
      // Shows up as a 'verto_dvar_email' dialplan variable.
      email: 'test@test.com'
    },
    // Use a dedicated outbound encoder for this user's video.
    // NOTE: This is generally only needed if the user has some kind of
    // non-standard video setup, and is not recommended to use, as it
    // dramatically increases the CPU usage for the conference.
    dedEnc: false,
    // Example of setting the devices per-call.
    useMic: 'any',
    useSpeak: 'any',
  });
};

const showIncomingCall = (number) => {
  UI.incomingCallNumber.text(number);
  incomingCallDialog.showModal();
};

const closeIncomingCall = () => {
  incomingCallDialog.close();
}

const answerCall = () => {
  currentCall.answer({
    useVideo: false,
    useStereo: false,
  });
}

const hungupCall = () => {
  if(currentCall) currentCall.hangup();
}

const holdCall = () => {
  currentCall.hold();
};

const unholdCall = () => {
  currentCall.unhold();
};

const transferCall = (number) => {
  if(number) {
    console.log('Transfering call to: ' + number)
    currentCall.transfer(number);
  }
};

const sendDtmf = (dtmf) => {
  if (currentCall) currentCall.dtmf(dtmf);
};

const disconnect = () => {
  if(!verto) return; 
  verto.logout();
}

UI.connectButton.on('click', () => {
  disconnect();

  $.verto.init({}, bootstrap);
});

UI.disconnectButton.on('click', () => {
  disconnect();
  UI
});

UI.answerCallButton.on('click', answerCall);
UI.declineCallButton.on('click', hungupCall);
UI.closeDialogButton.on('click', closeIncomingCall);

UI.hangupButton.on('click', hangupCall);

UI.dtmfButtons.on('click', (e) => {
  const tone = parseInt(e.target.innerText);
  console.log('Sending ' + tone);
  if(tone) sendDtmf(tone);
});


UI.callButton.on('click', makeCall);

UI.transferButton.on('click', () => transferCall(transferTarget.value));
UI.muteCheckbox.on('change', (e) => currentCall.setMute(e.target.checked));
UI.holdCheckbox.on('change', (e) => e.target.checked ? holdCall() : unholdCall());