import express from 'express';
import nunjucks from 'nunjucks';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';

const __dirname = path.resolve();

const app = express();

//file path
// my_app/data/writing.json
const filePath = path.join(__dirname,'data','writing.json');

// body parser set
app.use(bodyParser.urlencoded({ extended: false })); // express 기본 모듈 사용
app.use(bodyParser.json());

// view engine set
app.set('view engine', 'html'); // main.html -> main(.html)

// nunjucks
nunjucks.configure('views', {
    watch: true, // html 파일이 수정될 경우, 다시 반영 후 렌더링
    express: app
})
//mongoose connect
mongoose
    .connect('mongodb://127.0.0.1:27017')
    .then(()=>console.log('연결 성공'))
    .catch(e => console.error(e))

//mongoose set
const { Schema } = mongoose;

const writingSchema = new Schema({
    title: String,
    contents: String,
    date:{
        type: Date,
        default: Date.now,
    } 

})
const Writing = mongoose.model('Writing',writingSchema);
// middleware
// main page GET
app.get('/', async (req, res) => {
   // const fileData = fs.readFileSync(filePath);
   // const writings = JSON.parse(fileData);

   //쓴 글 모두 가져오기
    let writings = await Writing.find({})

    res.render('main',{list:writings});
   
});

app.get('/write', (req, res) => {
    res.render('write');


});

app.post('/write', async (req, res) => {
    const title = req.body.title;
    const contents = req.body.contents;

    //monggodb에 저장
    const writing = new Writing({
        title: title,
        contents: contents


    })
    const result = await writing.save().then(()=>{
        console.log('Succeess')
        res.render('detail',{'detail':{title:title, contents: contents}});
    }).catch((err)=>{console.error(err)
        res.render('write')
    })


    // const fileData = fs.readFileSync(filePath);
    // const writings = JSON.parse(fileData);

    // //request를 저장
    // writings.push({
    //     'title' : title,
    //     'contents' : contents,
    //     'date' : date

    // });

    // // data/writring.json에 저장하기
    // fs.writeFileSync(filePath, JSON.stringify(writings));

    //res.render('detail',  { title: title, contents: contents, date: date } );
});

app.get('/detail/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const detail = await Writing.findById(id);
        res.render('detail', { detail: detail });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/delete/:id',async(req, res) => {
    const id = req.params.id;

    const delete_content = await Writing.deleteOne({ _id: id}).then(()=>{

        console.log('delete');
        res.redirect('/');
    }).catch((err) => {
        console.error(err);

    })
})

app.get('/edit/:id', async (req, res) => {
    const id = req.params.id;

    const edit = await Writing.findOne({ _id: id }).then((result) => {
        res.render('detail', { 'edit': result })
    }).catch((err) => {
        console.error(err)
    })
})

app.post('/edit/:id', async (req, res) => {
    const id = req.params.id;
    const title = req.body.title;
    const contents = req.body.contents;

    const edit = await Writing.replaceOne({ _id: id }, { title: title, contents: contents }).then((result) => {
        console.log('update success')
        res.render('detail', { 'detail': { 'id': id, 'title': title, 'contents': contents } });
    }).catch((err) => {
        console.error(err)
    })
})

app.listen(3000, () => {
    console.log('Server is running');
});