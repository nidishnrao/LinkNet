const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/signup', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/profile', auth, async (req, res) => {
        res.send(req.user)
})

router.get('/search', auth, async (req, res) => {
    try {
        const users = await User.find({"private":false})
        res.send(users)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/search/:name', auth, async (req, res) => {
    const name = req.params.name
 
    try {
        const user = await User.findOne({name})
        console.log("name",user)
        console.log("body",user.private)
        if (!user) {
            return res.status(404).send({ error: "No User's Found!" })
        }
        else if (!user.private) {
            res.send(user)
        }
        else{
            return res.status(400).send({ error: 'No Access! Private Profile' })
        }

    } catch (e) {
        res.status(500).send()
    }
})

router.patch('/profile/update', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'phone', 'password', 'bio']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/profile/delete', auth, async (req, res) => {
    try {
        await req.user.remove()
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router