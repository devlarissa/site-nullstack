const fs = require('fs')
const path = require('path')
const pugBeautify = require('pug-beautify')
const sharp = require('sharp')
const scssfmt = require('scssfmt')

const gitAdd = (() => {
    const simpleGit = require('simple-git')('.')
    if (process.argv.indexOf('--git-add') === -1) {
        return () => {
        }
    }
    return (file) => {
        simpleGit.add(file)
    }
})()

function beautifier(target) {
    return function (file) {
        fs.readFile(file, 'utf8', ((err, code) => {
            if (err) {
                console.error(err)
            }
            const formatted = target(code)
            if (formatted === code) {
                return
            }
            fs.writeFile(file, formatted, (err) => {
                if (err) {
                    console.error(err)
                }
                gitAdd(file)
            })
        }))
    }
}

const data = {
    pug: beautifier(function (code) {
        return pugBeautify(code, {
            fill_tab: false,
            omit_div: true,
            tab_size: 4
        })
    }),
    scss: beautifier(scssfmt),
    png: async function (file) {
        const [baseName, ext] = path.basename(file).split('.')
        const height = parseInt(baseName.split('@')[1])
        const hasHeight = !Number.isNaN(height)
        if (!hasHeight && ext === 'webp') {
            return
        }
        let img = sharp(file)
        let resized = false
        if (hasHeight && height !== (await img.metadata()).height) {
            img = img.resize(null, height)
            resized = true
        }
        if (ext !== 'webp') {
            img = img.webp()
        } else if (!resized) {
            return
        }
        const data = await img.toBuffer()
        const outPath = path.join(path.dirname(file), `${baseName}.webp`)
        fs.writeFile(outPath, data, (err) => {
            if (err) {
                console.error(err)
                return
            }
            if (file !== outPath) {
                fs.unlinkSync(file)
                gitAdd(file)
            }
            gitAdd(outPath)
        })
    }
}
data.webp = data.jpg = data.jpeg = data.png

function walkDir(dir) {
    fs.readdir(dir, (err, files) => {
        if (err) {
            return
        }
        files.forEach((file) => {
            const location = path.join(dir, file)
            if (fs.statSync(location).isDirectory()) {
                walkDir(location)
                return
            }
            const ext = path.extname(file).slice(1)
            const func = data[ext]
            if (func != null) {
                func(location)
            }
        })
    })
}

walkDir('./src')
