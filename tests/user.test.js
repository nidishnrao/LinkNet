const request = require('supertest')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const app = require('../src/app')
const User = require('../src/models/user')

const userOneId = new mongoose.Types.ObjectId()
const userOne = {
    _id: userOneId,
    name: 'Luffy',
    email: 'luffy@onepiece.com',
    password: 'luffy666!!',
    phone: 9321897513,
    private: true,
    tokens: [{
        token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET)
    }]
}

beforeEach(async () => {
    await User.deleteMany()
    await new User(userOne).save()
})

//1. Sign Up
test('Should signup a new user', async () => {
    const response = await request(app).post('/signup').send({
        name: 'Nidish',
        email: 'Nidish@gmail.com',
        password: 'Nid@123!',
        phone: 9120559889,
        private: true
    }).expect(201)

        // Assert that the database was changed correctly
        const user = await User.findById(response.body.user._id)
        expect(user).not.toBeNull()
    
        // Assertions about the response
        expect(response.body).toMatchObject({
            user: {
                name: 'Nidish',
                email: 'nidish@gmail.com'
            },
            token: user.tokens[0].token
        })
        expect(user.password).not.toBe('Nid@123!')
})

//2. Login
test('Should login existing user', async () => {
    const response = await request(app).post('/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)
    const user = await User.findById(userOneId)
    expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should not login nonexistent user', async () => {
    await request(app).post('/login').send({
        email: userOne.email,
        password: 'thisisnotmypass'
    }).expect(400)
})

//3. Logout 
test('Should logout logged in user', async () => {
    await request(app)
        .post('/logout')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

})

test('Should not logout non-logged in user', async () => {
    await request(app)
        .post('/logout')
        .send()
        .expect(401)
})

//4. Profile
test('Should get profile for user', async () => {
    await request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/profile')
        .send()
        .expect(401)
})

//5. Delete Profile
test('Should delete account for user', async () => {
    await request(app)
        .delete('/profile/delete')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
        const user = await User.findById(userOneId)
        expect(user).toBeNull()
})

test('Should not delete account for unauthenticate user', async () => {
    await request(app)
        .delete('/profile/delete')
        .send()
        .expect(401)
})

//6. Update Profile
test('Should update valid user fields', async () => {
    await request(app)
        .patch('/profile/update')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'Zoro'
        })
        .expect(200)
    const user = await User.findById(userOneId)
    expect(user.name).toEqual('Zoro')
})

test('Should not update invalid user fields', async () => {
    await request(app)
        .patch('/profile/update')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            location: 'Philadelphia'
        })
        .expect(400)
})


