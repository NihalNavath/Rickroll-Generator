let errorActive = false;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const generateRickroll = async () => {
    if (!validate()) return;
    const url = encodeURI((<HTMLInputElement>document.getElementById("title")).value);
    const desc = (<HTMLInputElement>document.getElementById("description")).value;
    const title = (<HTMLInputElement>document.getElementById("title")).value;
    const ImgUrlValue = (<HTMLInputElement>document.getElementById("ImgUrl")).value;
    const type = (<HTMLInputElement>document.getElementById("type")).value;
    const expiry = (<HTMLInputElement>document.getElementById("expiry")).value;

    const errorDiv = document.getElementById("server-preview-error");

    const options = {
        method: "post",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            url: url,
            title: title,
            description: desc,
            type: type,
            expiry: expiry,
            ImgUrl: ImgUrlValue
        }),
    };
    const response = await fetch("/api/generate", options)
        .then(async (response) => {
            if (response.ok) {
                return response.json();
            } else {
                const res = await response.json();
                const error = `Server responded with ${response.status}: ${res.error}`;
                const child = `<p>Server Error: report using contact form or through discord.<br>${error} </p>`;
                errorDiv.innerHTML = child;
                document.getElementById("server-preview-error").style.display = "block";
                throw new Error(`Server responded with ${response.status} -_-`);
            }
        })
        .catch(error => console.log(error));

    const dataLink = `${document.location.origin}/data?url=${encodeURI(response.url)}`;
    document.location = dataLink;
};

function previewImg(url) {
    if (url.indexOf("http://") != 0 && url.indexOf("https://") != 0) {
        imagePreviewError("The url needs to start with https:// or http://");
    }
    const img = document.getElementById("img-preview");
    fetch(url, {
        method: "GET",
    })
        .then((response) => {
            if (response.status == 200) {
                document.getElementById("img-preview").setAttribute("src", url);
                if (errorActive) {
                    imagePreviewError();
                }
            } else {
                img.setAttribute("src", "/img/invalid.png");
                imagePreviewError("The url is not valid");
            }
        })
        .catch(() => {
            img.setAttribute("src", "/img/invalid.png");
            imagePreviewError("The url is not valid");
        });
}

const imagePreviewError = (error?: string | undefined) => {
    if (!error) {
        document.getElementById("container-preview-error").style.display = "none";
        errorActive = false;
        return;
    }
    const errorDIV = document.getElementById("img-preview-error");
    error = "⚠️ " + error;
    errorDIV.innerHTML = error;
    document.getElementById("container-preview-error").style.display = "block";
    errorActive = true;
};

const validate = () => {
    const requiredFields = document.querySelectorAll("[required]");
    for (let i = 0; i < requiredFields.length; i++) {
        if (!(requiredFields[i] as HTMLInputElement).value) {
            return false;
        }
    }
    return true;
};

document.getElementById("ImgUrl").addEventListener("input", (e) => {
    const target = e.target as HTMLInputElement;
    if (target.value) {
        previewImg(target.value);
    } else {
        document.getElementById("img-preview").setAttribute("src", "/img/preview.png");
    }
});