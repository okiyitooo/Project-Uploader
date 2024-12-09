require('dotenv').config()
const express = require('express')
const bodyparser = require('body-parser')
const mongoose = require('mongoose')

const app = express()
const port  = process.env.PORT || 3000
mongoose.connect(process.env.MONGO_DB_URI)

const db = mongoose.connection
db.on('error',console.error.bind(console,'MongoDB connection error: '))

const projectSchema = new mongoose.Schema({
    name: {type: String, unique: true, required: true, index: true},
    website: { type: String, unique: true, required: true,  },
    tags: {type: [String], required: true},
    comments: String
},{ _id: true})

const Project = mongoose.model('Project', projectSchema)

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
    next();
  })
app.use(bodyparser.urlencoded({extended: true}))
app.use(express.static('public'))
app.get('/',(req,res)=>{
    res.sendFile(__dirname +  '/views/index.html')
})

app.post('/submit',(req,res)=>{
    const {title, website, tags, comments } = req.body
    console.log(req.body)
    const websiteRegex = /^(https?:\/\/)?(www\.)?([_a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}([\/?#]|$)/i;
    if (!websiteRegex.test(website))
        return res.status(400).send('Invalid website URL')
    const newProject = new Project({
        name: title,
        website: website,
        tags: tags.split(',').map(tag=>tag.trim())
        ,comments: comments
    })
    newProject.save()
  .then(() => { 
    res.send('Project saved successfully'); 
  })
  .catch(err => {
    if (err.code===11000)
        res.status(400).send('A project with this website/name already exists.');
    else 
        res.status(500).send('Error saving data to database'); 
  });
    
})
app.get('/download-projects', (req, res) => {
    Project.find({})
    .then(projects => {
        const json = JSON.stringify(projects);
        res.setHeader('Content-disposition', 'attachment; filename=projects.json');
        res.setHeader('Content-type', 'application/json');
        res.send(json);
    }
    ).catch(err=>{
        console.error(err);
        res.status(500).send('Error fetching projects');
    })
  });
app.listen(port, ()=>{
    console.log(`Server running on port: ${port}`)
})