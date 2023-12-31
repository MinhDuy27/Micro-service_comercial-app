const { userrepository } = require("../Database");
const { notfoundError, validationError } = require("../Database/side-function/app-error");
const { generatepassword, generatesignature, validatepassword, generatesalt, formatedata } = require('../Database/side-function/side1');

//logic
class usersservice {
    constructor() {
        this.repository = new userrepository();
    }
    async login(userinputs) {
        const { email, password } = userinputs;
        const existingusers = await this.repository.findusers( email );
        if (!existingusers)
            throw new notfoundError("user can not be found by provided email")
        const validPassword = await validatepassword(password, existingusers.password, existingusers.salt);
        if (!validPassword)
            throw new validationError("invalid password")
        const token = await generatesignature({ email: existingusers.email, _id: existingusers._id });
        return formatedata({ id: existingusers._id, token });
    }
    async changepassword(userinputs) {
        const { email, oldpassword, newpassword } = userinputs;
        const existingusers = await this.repository.findusers( email );
        if (!existingusers)
            throw new notfoundError("user not found by provided email")
        const validPassword = await validatepassword(oldpassword, existingusers.password, existingusers.salt);
        if (!validPassword)
            throw new validationError("invalid oldpassword")
        let userpassword = await generatepassword(newpassword, existingusers.salt);
        return await this.repository.changepassword({email,userpassword})
    }
    async signup(userinputs) {
        const { email, password, name, phone } = userinputs;
        const existingusers = await this.repository.findusers( email );
        if (existingusers)
            return null
        //create salt
        let salt = await generatesalt();
        let userPassword = await generatepassword(password, salt);
        const existinguser = await this.repository.createusers({ email,password: userPassword, name, salt, phone });
        return formatedata({ id: existinguser._id });
    }
    async postnotify(userinput) {
        const { email, infor } = userinput;
        const existingusers = await this.repository.findusers(email );
        if (!existingusers) throw new notfoundError("user not found by provided email")
        return await this.repository.postnotify({ email, infor });
    }
    async addnewaddress(_id, userinputs) {
        const {
            country,
            province,
            city,
            street,} = userinputs;
        const data =  this.repository.createaddress({
             _id,
            country,
            province,
            city,
            street, })
        return formatedata(data)
    }
    async getprofile(_id) {
         const existinguser = await this.repository.findusersbyid({ _id });
         if (!existinguser) throw new notfoundError("user not found by provided id")
        return formatedata(existinguser);
    }
}

module.exports = usersservice;