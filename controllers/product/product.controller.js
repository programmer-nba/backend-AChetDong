const { Products } = require("../../model/product/product.model");
const dayjs = require("dayjs");
const { PriceProducts } = require("../../model/product/price.product.model");
const {
  HistoryProducts,
} = require("../../model/product/history.edit.product.model");
const {
  ProductsHistory,
} = require("../../model/product/history.create.product.model");
const { update } = require("./category.main.controller");
const line = require("../../lib/line.notify");

exports.create = async (req, res) => {
  try {
    let image = req.body.link_img;
    image = image.replace(`https://drive.google.com/file/d/`, "");
    image = image.replace(`/view?usp=sharing`, "");

    let description = req.body.description;
    (description = description.replace(`<p>`, "")),
      (description = description.replace(`</p>`, ""));

    const existingProduct = await Products.findOne({
      number: req.body.number,
      status: "active",
    });
    if (existingProduct) {
      return res.status(401).send({
        status: false,
        message: "เลขลำดับสินค้านี้มีในระบบแล้ว",
      });
    }
    const new_product = await new Products({
      ...req.body,
      pricture: image,
      description: description,
      $push: {
        update: {
          name: req.body.update.name,
          timestamp: Date.now()
        }
      }
    }).save();

    const productsHistory = await new ProductsHistory({
      ...req.body,
      pricture: image,
      description: description,
      $push: {
        update: {
          name: req.body.update.name,
          timestamp: Date.now()
        }
      }
    });
    const historyProduct = await productsHistory.save();

    return res.status(200).send({
      status: true,
      message: "เพิ่มสินค้าสำเร็จ",
      data: new_product,
      history: historyProduct,
    });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

exports.getProductAll = async (req, res) => {
  try {
    const products = await Products.find({ status: { $ne: "ลบสินค้า" } });
    if (!products)
      return res
        .status(404)
        .send({ status: false, message: "ดึงข้อมูลไม่สำเร็จ" });
    const updatedProducts = products.map((product) => {
      if (product.pricture) {
        product.pricture = product.pricture.split("/view?usp=sharing")[0];
      }
      return product;
    });

    return res.status(200).send({
      status: true,
      message: "ดึงข้อมูลสำเร็จ",
      data: updatedProducts,
    });
  } catch (err) {
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

exports.getProductAllByName = async (req, res) => {
  try {
    const history = await Products.find({ status: "ลบสินค้า" });

    if (history.length > 0) {
      return res.status(200).send({
        status: true,
        message: "ดึงข้อมูลประวัติการแก้ไขข้อมูลสินค้าสำเร็จ",
        data: history,
      });
    } else {
      return res.status(404).send({
        message: "ไม่พบข้อมูลประวัติการแก้ไขข้อมูลสินค้า",
        status: false,
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error.message,
      status: false,
    });
  }
};

exports.getProductLatest = async (req, res) => {
  try {
    const latestHistory = await HistoryProducts.aggregate([
      {
        $sort: { "update.timestamp": -1 },
      },
      {
        $group: {
          _id: "$number",
          latestItem: { $first: "$$ROOT" },
        },
      },
    ]);

    const formattedData = latestHistory.map((item) => item.latestItem);

    return res.status(200).send({
      status: true,
      message: "ดึงข้อมูลประวัติการแก้ไขข้อมูลสินค้าสำเร็จ",
      data: formattedData,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      status: false,
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Products.findById(id);
    if (!product)
      return res
        .status(404)
        .send({ status: false, message: "ดึงข้อมูลไม่สำเร็จ" });
    return res
      .status(200)
      .send({ status: true, message: "ดึงข้อมูลสำเร็จ", data: product });
  } catch (err) {
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

exports.update = async (req, res) => {
  try {
    if (!req.body)
      return res
        .status(404)
        .send({ status: false, message: "ส่งข้อมูลผิดพลาด" });

    const id = req.params.id;
    const ChckProduct = await Products.findOne({
      // number: req.body.number,
      _id: { $ne: id },
    });
    if (!ChckProduct) {
      return res.status(400).send({
        status: false,
        message: "ไม่มีข้อมูล",
      });
    }

    Products.findByIdAndUpdate(id, {
      category_main: req.body.category_main,
      category_second: req.body.category_second,
      model: req.body.model,
      pricture: req.body.pricture,
      hl: req.body.hl,
      description: req.body.description,
      price: {
        one: req.body.price.one,
        two: req.body.price.two,
        tree: req.body.price.tree,
        four: req.body.price.four,
        five: req.body.price.five,
        six: req.body.price.six,
      },
      note: req.body.note,
      lnsure: req.body.lnsure, //ประกัน
      link_spec: req.body.link_spec,
      link_document: req.body.link_document,
      link_img: (req.body.pricture != '' ? "https://drive.google.com/file/d/" + req.body.pricture + "/view?usp=sharing" : ""),
      $push: {
        update: {
          name: req.body.update.name,
          timestamp: Date.now(),
        },
      }
    }, {
      useFindAndModify: false,
      new: true,
    }).then(async (item) => {
      if (!item)
        return res
          .status(404)
          .send({ status: false, message: "....แก้ไขข้อมูลไม่สำเร็จ" });

      const message = `
สินค้า : ${item.model}
รายการสินค้าดังกล่าวมีการอัพเดทข้อมูลใหม่

สามารถตรวจสอบได้ที่ : ...............`;
      await line.linenotify(message);
      const updatedProduct = await Products.findOne({ _id: id });
      if (updatedProduct) {
        const historyData = new HistoryProducts({
          number: item.number,
          status: item.status,
          category_main: item.category_main,
          category_second: item.category_second,
          model: item.model,
          pricture: item.pricture,
          description: item.description,
          hl: item.hl,
          description: item.description,
          price: {
            one: item.price.one,
            two: item.price.two,
            tree: item.price.tree,
            four: item.price.four,
            five: item.price.five,
            six: item.price.six,
          },
          note: item.note,
          lnsure: item.lnsure,
          update: item.update,
          link_spec: item.link_spec,
          link_document: item.link_document,
          link_img: item.link_img,
        });
        const historyProduct = await historyData.save();
        if (historyProduct) {
          return res.status(200).send({
            status: true,
            message: "แก้ไขข้อมูลสำเร็จ",
            data: updatedProduct,
          });
        } else {
          return res.status(500).send({
            status: false,
            message: "เกิดข้อผิดพลาดในการบันทึกประวัติ",
          });
        }

      } else {
        return res
          .status(403)
          .send({ message: "เกิดข้อผิดพลาดเกี่ยวกับผู้อัปเดต" });
      }
    })
      .catch((err) => {

        console.log(err);
        return res
          .status(500)
          .send({ status: false, message: err.message + id });
      });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    Products.findByIdAndDelete(id, { useFindAndModify: false })
      .then((item) => {
        if (!item)
          return res
            .status(404)
            .send({ message: "ไม่สามารถลบข้อมูลสินค้านี้ได้" });
        return res.status(200).send({ message: "ลบข้อมูลสินค้าสำเร็จ" });
      })
      .catch((err) => {
        res.status(500).send({
          message: "ไม่สามารถลบข้อมูลสินค้านี้ได้",
          status: false,
        });
      });
  } catch (err) {
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

//ดึงประวัติการเเก้ไขข้อมุลสินค้า
exports.GetAllHistory = async (req, res) => {
  try {
    const history = await HistoryProducts.find();
    if (history.length > 0) {
      return res.status(200).send({
        status: true,
        message: "ดึงข้อมูลประวัติการเเก้ไข้ข้อมูลสินค้าสำเร็จ",
        data: history,
      });
    } else {
      return res.status(404).send({
        message: "ดึงข้อมูลประวัติการเเก้ไข้ข้อมูลสินค้าไมสำเร็จ",
        status: false,
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error.message,
      status: false,
    });
  }
};
exports.GetHistoryID = async (req, res) => {
  try {
    const id = req.params.id;
    const history = await HistoryProducts.findOne({ _id: id });
    if (history) {
      return res.status(200).send({
        status: true,
        message: "ดึงข้อมูลประวัติการทำงานสำเร็จ",
        data: history,
      });
    } else {
      return res
        .status(404)
        .send({ message: "ดึงข้อมูลประวัติการทำงานไม่สำเร็จ", status: false });
    }
  } catch (error) {
    res.status(500).send({
      message: "มีบางอย่างผิดพลาด",
      status: false,
    });
  }
};
exports.GetHistoryByNumber = async (req, res) => {
  try {
    const number = req.params.number;
    const history = await HistoryProducts.find({ number: number });
    console.log(history);
    if (history) {
      return res.status(200).send({
        status: true,
        message: "ดึงข้อมูลประวัติการทำงานสำเร็จ",
        data: history,
      });
    } else {
      return res
        .status(404)
        .send({ message: "ดึงข้อมูลประวัติการทำงานไม่สำเร็จ", status: false });
    }
  } catch (error) {
    res.status(500).send({
      message: "มีบางอย่างผิดพลาด",
      status: false,
    });
  }
};

//ดึงประวัติการสร้างสินค้า
exports.GetAllHistoryCreate = async (req, res) => {
  try {
    const history = await ProductsHistory.find();
    if (history.length > 0) {
      return res.status(200).send({
        status: true,
        message: "ดึงข้อมูลประวัติการสร้างสินค้าสำเร็จ",
        data: history,
      });
    } else {
      return res.status(404).send({
        message: "ดึงข้อมูลประวัติการสร้างสินค้าไม่สำเร็จ",
        status: false,
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error.message,
      status: false,
    });
  }
};
exports.GetHistoryCreateID = async (req, res) => {
  try {
    const id = req.params.id;
    const history = await ProductsHistory.findOne({ _id: id });
    if (history) {
      return res.status(200).send({
        status: true,
        message: "ดึงข้อมูลประวัติการสร้างสินค้าสำเร็จ",
        data: history,
      });
    } else {
      return res.status(404).send({
        message: "ดึงข้อมูลประวัติการสร้างสินค้าไม่สำเร็จ",
        status: false,
      });
    }
  } catch (error) {
    res.status(500).send({
      message: "มีบางอย่างผิดพลาด",
      status: false,
    });
  }
};

//เพิ่่มสถาณะ inactive
exports.inactiveProduct = async (req, res) => {
  try {
    const id = req.params.id;

    const updateStatus = await Products.findOneAndUpdate(
      { _id: id },
      { $set: { status: "inactive" } },
      { new: true }
    );

    if (updateStatus) {
      return res.status(200).send({
        status: true,
        message: "inactive success",
        data: updateStatus,
      });
    } else {
      return res.status(500).send({
        message: "มีบางอย่างผิดพลาด",
        status: false,
      });
    }
  } catch (error) {
    return res.status(500).send({ message: error.message, status: false });
  }
};
exports.actionProduct = async (req, res) => {
  try {
    const id = req.params.id;

    const updateStatus = await Products.findOneAndUpdate(
      { _id: id },
      { $set: { status: "active" } },
      { new: true }
    );

    if (updateStatus) {
      return res.status(200).send({
        status: true,
        message: "active success",
        data: updateStatus,
      });
    } else {
      return res.status(500).send({
        message: "มีบางอย่างผิดพลาด",
        status: false,
      });
    }
  } catch (error) {
    return res.status(500).send({ message: error.message, status: false });
  }
};
exports.DeleteProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const name = req.body.name;

    const updateStatus = await Products.findOneAndUpdate(
      { _id: id },
      { status: "ลบสินค้า", $push: { update: { name: name, timestamp: Date.now() } } },
      { new: true }
    );

    if (updateStatus) {
      return res.status(200).send({
        status: true,
        message: "ลบสินค้าสำเร็จ",
        data: updateStatus,
      });
    } else {
      return res.status(500).send({
        message: "มีบางอย่างผิดพลาด",
        status: false,
      });
    }
  } catch (error) {
    return res.status(500).send({ message: error.message, status: false });
  }
};

const updateNumber = async (req, res) => {
  try {
    const product = await Products.find();
    const amount = product.length + 1;
    for (let i = req.body.number; i < amount; i++) {
      const product = await Products.findOne({
        number: i,
      });
      product.number = Number(i) + 1;
      product.save();
    }
    let image = req.body.link_img;
    (image = image.replace(`https://drive.google.com/file/d/`, "")),
      (image = image.replace(`/view?usp=drive_link`, ""));

    let description = req.body.description;
    (description = description.replace(`<p>`, "")),
      (description = description.replace(`</p>`, ""));
    const new_product = await new Products({
      ...req.body,
      pricture: image,
      description: description,
    }).save();
    return res
      .status(200)
      .send({ status: true, message: "เพิ่มสินค้าสำเร็จ", data: new_product });
  } catch (err) {
    return res.status(500).send({ message: "Internal Server Error" });
  }
};
