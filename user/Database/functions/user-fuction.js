const  usersmodel  = require("../models/users");
const  addressmodel  = require("../models/address");

class usersrepository {
  async createusers( {email,password,name,salt,phone }) {
    try {
      const users = new usersmodel({
        email,
        password,
        name,
        salt,
        phone,
        address: [],
      });
      return await users.save();
    } catch (error) {
      throw error
    }   
  }
  async createaddress({ _id,country,province,city,street, }) {
      const profile = await usersmodel.findById(_id);
      const newAddress = new addressmodel({
        country,
        province,
        city,
        street,
      });
      await newAddress.save();
      profile.address.push(newAddress);
      await profile.save();

      return profile;
  }
  async changepassword({email,userpassword}){
        const query = { email: email };
        const update = { $set: { password: userpassword }};
        const options = {};
        return await usersmodel.updateOne(query, update, options)
  }
  async postnotify({email,infor}){
      const existingusers = await usersmodel.findOne({ email: email });
      let notidate = new Date().toLocaleString();
      const newNotification = {
        infor: infor,
        date: notidate
      };
      existingusers.notification.push(newNotification);
      return existingusers.save();
  }
  async findusers( email ) {
      return await usersmodel.findOne({ email: email }); 
  }

  async findusersbyid({ _id }) {
      return await usersmodel.findById(_id).populate("address");
  }
};
module.exports = usersrepository;