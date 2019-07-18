// uncomment line below to register offline cache service worker 
// navigator.serviceWorker.register('../serviceworker.js');

if (typeof fin !== 'undefined') {
    init();
} else {
    document.querySelector('#of-version').innerText =
        'The fin API is not available - you are probably running in a browser.';
}

//once the DOM has loaded and the OpenFin API is ready
async function init() {
    //get a reference to the current Application.
    const app = await fin.Application.getCurrent();
    const win = await fin.Window.getCurrent();

    makeProvider();
    const ofVersion = document.querySelector('#of-version');
    ofVersion.innerText = await fin.System.getVersion();
    // document.getElementById('btn').addEventListener('click', launchApplication);
    document.getElementById('open-child').addEventListener('click', openChild);
    document.getElementById('close-children').addEventListener('click', closeChildren);


    //Only launch new windows from the main window.
    if (win.identity.name === app.identity.uuid) {


        fin.System.showDeveloperTools(win.identity);
        //subscribing to the run-requested events will allow us to react to secondary launches, clicking on the icon once the Application is running for example.
        //for this app we will  launch a child window the first the user clicks on the desktop.
        app.once('run-requested', async () => {
            await fin.Window.create({
                name: 'childWindow',
                url: location.href,
                defaultWidth: 320,
                defaultHeight: 320,
                autoShow: true
            });
        });
    }
}

let bc;
async function makeProvider() {
    const channelName = 'close-children';
    // const provider = await fin.InterApplicationBus.Channel
    bc = new BroadcastChannel(channelName);
    bc.onmessage = closeOnDemand;
    console.log(bc)
}

function closeOnDemand({ data: { requesterName } }) {
    if (window.opener && requesterName === window.opener.name) {
        fin.Window.getCurrentSync().close();
    }
    else {
        return "no children"
    }
}

let myChildren = [];
async function openChild() {
    const { identity: { uuid } } = await fin.Window.getCurrent();
    const win = await fin.Window.create({
        uuid,
        name: `New window ${Date.now()}`,
        url: window.location.href
    })
    myChildren.push(win);
}

async function closeChildren() {
    console.log('close-children')
    bc.postMessage({ requesterName: fin.Window.getCurrentSync().identity.name })
}