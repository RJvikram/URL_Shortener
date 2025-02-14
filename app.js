import {readFile, writeFile} from "fs/promises"
import {createServer} from "http"
import path from "path"
import crypto from "crypto"; // Import crypto module

//Now we read the file where we store that shortCode's value as a objects
const DATA_FILE = path.join("data", 'links.json')
                
const  serverFile = async (res, filePath, tryContentType, catchContentType) =>{
    try{
        const data = await readFile(filePath)
        res.writeHead(200, {"Content-Type": tryContentType})
        res.end(data)
    }catch(err){    
        res.writeHead(404, {"Content-Type": catchContentType})
        res.end("404 Page Not Found")
    }
}

// Ensures that the given file exists. If it does not exist, creates it with an empty JSON object.
// If the file exists, reads and returns its content as a dictionary.
// param filepath: str - The path of the file to check and read.
// return: dict - The JSON content of the file (empty if newly created)
const loadLink = async (links) =>{
    try{
        const data = await readFile(links, "utf-8");
        return JSON.parse(data)
    }catch (error){
        if (error.code === "ENOENT"){
            await writeFile(links, JSON.stringify({}));
            return {};
        } throw error
    }
}

// this function basically use for save our object and provided json file as a json format
const saveLink = async (links) =>{
    try{
        await writeFile(DATA_FILE, JSON.stringify(links), "utf-8")
    }catch(error){
        console.log("Error while saving data in provided path : ", error)
    }
}

const server = createServer(async (req, res) =>{
    console.log(req.url)
    if (req.method === "GET"){
        if (req.url === "/"){
            serverFile(res, path.join("public", "index.html"), "text/html", "text/plain")
        }
        else if (req.url === "/styles.css"){
            serverFile(res, path.join("public", "styles.css"), "text/css", "text/plain")
        }
        else if (req.url === "/links"){
            const link = await loadLink(DATA_FILE)
            res.writeHead(200, {"Content-Type" : "application/json"})
            return res.end(JSON.stringify(link))
        }
        else{
            const link = await loadLink(DATA_FILE)
            // console.log(link)
            const url = req.url.slice(1)
            console.log("url : ", url, link[url])
            if (link[url]){
                res.writeHead(302,{location:link[url]})
                return res.end()
            }else{
                res.writeHead(404, {"Content-Type" : "application/json"})
                res.end("ShortCode Url Not Founds. ")
            }
        }
    }
    if (req.method === "POST" && req.url === "/shorten"){
        // read the data from the response
        var body = ""
        req.on("data", async (chunk) =>(body +=chunk));

        // after complete read data from request we need to assign that readd value in variable.
        req.on("end", async () =>{
            try{
                if (!body) {
                    throw new Error("Empty request body");
                }
                const {url , shortCode} = JSON.parse(body);

                // after assign need to check id url variable have value or not. if not then need to show error message.
                if (!url){
                    res.writeHead(400, {"Content-Type" : "application/json"})
                    return res.end("URL is Required!")
                }
                
                // now we are checking is we have value for shortCode if not then we generate random value for that variable
                const finalShortCode = shortCode || crypto.randomBytes(4).toString('hex')
                
                
                // now we read that file from this function
                const link = await loadLink(DATA_FILE);
                console.log(body)
                // now need to check is provided shortCode is already existsSync.
                if (link[finalShortCode]){
                    res.writeHead(400, {"Content-Type" : "application/json"})
                    return res.end("Provided Short Code Already Exist.")
                }

                // we need to convert that as a object format
                link[finalShortCode] = url
                
                // now we need to save that objects on provided file
                await saveLink(link)

                res.writeHead(200, {"Content-Type" : "application/json"})

                res.end(JSON.stringify({
                    "success" : true,
                    "shortCode" : finalShortCode
                }))
                
            }catch (error){
                console.log("Error from js : ", error)
            }

        })

    }
})

const PORT = 3000
server.listen(PORT, () => {
    console.log(`Your server URL is http://localhost:${PORT}`)
})