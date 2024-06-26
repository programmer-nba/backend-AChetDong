const router = require("express").Router();
const {Employees} = require("../model/user/employee.model");
const {Admins} = require("../model/user/admin.model");
const bcrypt = require("bcrypt");
require("dotenv").config();

router.post("/", async (req, res) => {
  try {
    let admin = await Admins.findOne({admin_username: req.body.username});
    if (!admin) {
      await checkEmployee(req, res);
    } else {
      const validatePasswordAdmin = await bcrypt.compare(
        req.body.password,
        admin.admin_password
      );
      if (!validatePasswordAdmin) {
        return res
          .status(403)
          .send({status: false, message: "Invalid password"});
      } else {
        const token = admin.generateAuthToken();
        const ResponesData = {
          name: admin.admin_name,
          username: admin.admin_username,
          position: admin.admin_position,
        };
        return res.status(200).send({
          token: token,
          message: "เข้าสู่ระบบสำเร็จ",
          result: ResponesData,
          level: "admin",
          status: true,
        });
      }
    }
  } catch (err) {
    return res.status(500).send({message: "Internal Server Error"});
  }
});

const checkEmployee = async (req, res) => {
  try {
    let employee = await Employees.findOne({username: req.body.username});
    if (!employee) {
      return res.status(404).send({status: false, message: "User not found"});
    } else {
      const validPasswordEmployee = await bcrypt.compare(
        req.body.password,
        employee.password
      );
      if (!validPasswordEmployee) {
        return res
          .status(403)
          .send({status: false, message: "Invalid password"});
      } else {
        const token = employee.generateAuthToken();
        const ResponseData = {
          name: employee.name,
          username: employee.username,
          position: employee.position,
          subposition: employee?.subposition,
        };
        return res.status(200).send({
          token: token,
          message: "เข้าสู่ระบบสำเร็จ",
          result: ResponseData,
          level: "employee",
          status: true,
        });
      }
    }
  } catch (err) {
    return res.status(500).send({message: "Internal Server Error"});
  }
};

module.exports = router;
