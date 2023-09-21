const mongoose = require('mongoose')
require('mongoose-long')(mongoose)
const {Types: {Long}} = mongoose
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

//Creating schema and passing user model as argument for middleware functionality
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required : true,
        trim : true
    },
    email : {
        type: String,
        unique : true,
        required : true,
        trim : true,
        lowercase : true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Email is Invalid")
            }
        }
    },
    phone : {
        type: Long,
        required:true,
        validate(value){
            if(value.toString().length!=10 && value.toString().length>0){
                throw new Error("Phone Number is Invalid")
            }
        }
    },
    password:{
        type: String,
        required : true,
        trim : true, 
        minlength : 6,
        validate(value){
            if(value.toLowerCase().includes(['password','chocolate'])){
                throw new Error("Password cannot contain 'Password'")
            }
        }
    },
    private:{
        type:Boolean,
        required : true,
        trim : true
    },
    bio:{
        type: String,
        default:'Hey there! I\'m using Linknet',
        trim : true
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true
})

//method for hiding private data such as password and tokens
userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.__v

    return userObject
}

//methods are for instances
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

//statics are methods for models
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

// Hash the plain text password before saving
//Pre is used  as a middleware to do before saving the request while Post is used after saving the request
userSchema.pre('save', async function (next) {
    const user = this
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

// Delete user tasks when user is removed
userSchema.pre('deleteOne', { document: true }, async function(next) {
    const user = this
    await Task.deleteMany({ owner: user._id })
    next()
  })

const User = mongoose.model('User', userSchema)

module.exports = User