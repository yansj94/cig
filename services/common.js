const fs = require("fs");
const { insInfo } = require("../modeltranform/dict.js");
const { InsInfoModel, DepModel, InsCodeModel, UserModel } = require("../repositories/mongoHelper");
const co = require("co");
const uuid = require("uuid");
const moment = require("moment");
const path = require("path");
const _ = require("lodash");
const { statusList, importHeaderOrder, exportHeaderOrder } = require("../modeltranform/statusrule.js");
const configSvc = require("./config.js");
var iconv = require('iconv-lite');
const xlsx = require('node-xlsx').default;

function formatCTime(time) {
    if (/\d{1,2}\/\d{1,2}\/\d{2}/.test(time)) {
        let str = time.split("/");
        let year = str[2];
        let month = str[0].length == 1 ? `0${str[0]}` : `${str[0]}`;
        let day = str[1].length == 1 ? `0${str[1]}` : `${str[1]}`;
        return `20${year}-${month}-${day}`;
    } else {
        return "1970-01-01"
    }
}

function existDev(code) {
    return new Promise((rs, rj) => {
        InsInfoModel.find({ code }, (err, res) => {
            if (err) {
                rj(err);
            } else {
                rs(res && res.length);
            }
        });
    }).catch(err => {
        console.log("get dev code exist", err);
        return false;
    })
}

function composeUser(keeper) {
    return new Promise((rs, rj) => {
        UserModel.find({ _id: keeper.split("&")[0] }, (err, res) => {
            if (err) {
                rj(err);
            } else {
                rs(res);
            }
        })
    }).then(data => {
        if (data && data.length) {
            data = data[0].toObject();
            return `${data.name}(${data.userId})`;
        } else {
            return null;
        }
    }).catch(err => {
        console.log("get User Info error:", err.message);
        console.log(err);
        return null;
    })
}

function getKeeper(name) {
    try {
        var match = name.match(/(\(|（)([A-Za-z]{1}\d{3,5})(\)|\）)/);
        if (match) {
            var userId = match[2];
        }
    } catch (e) {
        console.log(e);
    }

    return new Promise((rs, rj) => {
        UserModel.find({ userId }, (err, res) => {
            if (err) {
                rj(err);
            } else {
                rs(res);
            }
        })
    }).then(data => {
        if (data && data.length) {
            data = data[0].toObject();
            return `${data._id}&${data.name}`;
        } else {
            return null;
        }
    }).catch(err => {
        console.log("get User Info error:", err.message);
        console.log(err);
        return null;
    })
}

function getDepCode(code) {
    return new Promise((rs, rj) => {
        DepModel.find({ code }, (err, res) => {
            if (err) {
                rj(err);
            } else {
                rs(res);
            }
        })
    }).then(data => {
        if (data && data.length) {
            data = data[0].toObject();
            return `${data._id}&${data.name}&${data.keeper}`;
        } else {
            return null;
        }
    }).catch(err => {
        console.log("get Depby code error:", err.message);
        console.log(err);
        return null;
    })
}

function getInsCode(code) {
    if (typeof (code) == "string")
        code = code.replace(/\s/g, "");
    return new Promise((rs, rj) => {
        InsCodeModel.find({ code }, (err, res) => {
            if (err) {
                rj(err);
            } else {
                rs(res);
            }
        })
    }).then(data => {
        if (data && data.length) {
            data = data[0].toObject();
            return `${data._id}&${data.name}`;
        } else {
            return null;
        }
    }).catch(err => {
        console.log("get insCode error:", err.message);
        console.log(err);
        return 0;
    })
}

function exportFile(list, headerList) {
    let fileName = "仪器列表——" + moment().format("YYYY-MM-DD_HH_mm_ss") + ".xlsx";
    let outputFileName = path.dirname(__dirname) + "/tmp/" + fileName;
    let retList = [];
    retList.push(headerList.map(cur => {
        return cur.fieldTitle;
    }));

    list.forEach((cur, mIndex) => {

        retList.push(headerList.map((header) => {
            if (header.fieldName == "index") {
                return mIndex + 1;
            } else if (header.fieldName == 'org') {
                return "CIG";
            } else if (cur[header.fieldName]) {
                return cur[header.fieldName].replace(/\r/g, " ");
            } else {
                return "";
            }
        }));
    });

    var buffer = xlsx.build([{ name: "仪器列表", data: retList }]); // Returns a buffer
    return new Promise((rs, rj) => {
        fs.writeFile(outputFileName, buffer, err => {
            if (err) {
                rj(err);
            } else {
                rs("/cig/download/" + fileName);
            }
        });
    }).catch(err => {
        console.log("write file err", err.message);
        console.log(err);
        return "";
    });
};

function getPeriod(value) {
    if (typeof (value) == "string")
        value = value.replace(/\s/g, "")
    let period = value.match(/\d+/i);
    if (period == null)
        return null;

    let periodUnit = value.replace(period[0], "");
    switch (periodUnit) {
        case "日":
            periodUnit = "days";
            break;
        case "月":
            periodUnit = "months";
            break;
        case "周":
            periodUnit = "weeks";
            break;
        case "年":
            periodUnit = "years";
            break;
        default:
            return null;
    }
    period = parseInt(period[0]);
    return {
        periodUnit,
        period
    }
}

module.exports = {
    getImportContent: function (importFilePath) {
        return new Promise((rs, rj) => {
            rs();
        }).then(function (res) {
            return xlsx.parse(fs.readFileSync(importFilePath));
        }, function (err) {
            console.warn(err);
            return '';
        });
    },
    importInsList: function (list) {
        return co(function* () {
            let retList = [];
            let extendConfig = yield configSvc.getConfig("extendHeader");
            let index = 1;
            list.data.shift();
            for (let line of list.data) {
                let obj = {}
                if (line == "")
                    continue;
                let vals = line;
                if (vals.length < 18) { //insInfo.insertFields.length) {
                    try {
                        console.log(vals);
                        throw `第${index}行，导入格式有误`
                    } catch (e) {
                        console.log(e)
                        return `第${index}行，导入格式有误`;
                    }
                }

                function getValue(name) {
                    if (importHeaderOrder.hasOwnProperty(name)) {
                        return vals[importHeaderOrder[name]];
                    } else {
                        return "";
                    }
                }

                if (index == 248)
                    console.log("call")
                // let depCode = yield getDepCode(getValue("depCode"));
                // if (!!!depCode) {
                //     return "未找到相关的部门";
                // }
                obj["depCode"] = getValue("depCode");
                let period = getPeriod(getValue("period"));
                if (!!!period) {
                    return `第${index}行，校验周期错误`;
                }
                obj["period"] = period.period;
                obj["periodUnit"] = period.periodUnit;

                // let status = yield getStatus(getValue("status"));
                // 默认状态为test
                obj["status"] = "3";
                obj["nextStatus"] = "";
                obj["toConfirm"] = "1";
                // ((name) => {
                //     for (let item of statusList) {
                //         if (item.label == name) {
                //             return item.statusCode;
                //         }
                //     }
                // })(status);

                let insCode = yield getInsCode(getValue("insCode"));
                if (!!!insCode) {
                    return `第${index}行，${getValue("insCode")}，仪器编码错误或该编码不在系统内，请确认后重新导入`;
                }

                obj["insCode"] = insCode;

                obj["code"] = getValue("code");

                if (yield existDev(obj["code"])) {
                    console.log(`第${index++}行，系统内已存在`);
                    continue;
                } else {
                    obj["name"] = getValue("name");

                    obj["assertNo"] = getValue("assertNo");
                    obj["No"] = getValue("No");
                    obj["specification"] = getValue("specification");
                    obj["modelNo"] = getValue("modelNo");
                    let tstartDate = formatCTime(getValue("startDate"));
                    console.log(tstartDate)
                    obj["startDate"] = `${tstartDate} 00:00:00`;
                    let tendDate = formatCTime(getValue("endDate"));
                    console.log(tendDate)
                    obj["endDate"] = `${tendDate} 00:00:00`;
                    obj["description"] = getValue("description");
                    obj["testType"] = (function (type) {
                        let list = [{
                            value: "0",
                            label: "内校"
                        }, {
                            value: "1",
                            label: "外校"
                        }, {
                            value: "2",
                            label: "免校"
                        }];

                        for (let item of list) {
                            if (item.label == type) {
                                return item.value;
                            }
                        }
                    })(getValue("testType"));
                    obj["keeper"] = yield getKeeper(getValue("keeper"));
                    obj["isInit"] = true;


                    obj["extendFields"] = {};
                    extendConfig.value.forEach((cur, index, array) => {
                        obj["extendFields"][cur.fieldName] = vals[17 + index];
                    });

                    try {
                        var model = new InsInfoModel(obj);
                        var ret = yield model.save();
                        index++;
                        retList.push(ret._id);
                    } catch (e) {
                        console.log(e)
                        return e.message;
                    }
                }
            }

            return retList;
        })
    },
    exportList: function (headerList, extendHeaderList) {
        let depDict = [];
        let insCodeDict = [];

        let mainHeaderList = exportHeaderOrder.map(cur => {
            let fieldName = Object.keys(cur)[0];
            let fieldTitle = cur[fieldName];
            return {
                fieldName,
                fieldTitle
            }
        })

        return new Promise((rs, rj) => {
            InsCodeModel.find({}, (err, res) => {
                if (err) {
                    rj(err);
                } else {
                    rs(res);
                }
            })
        }).then(data => {
            if (data && data.length) {
                insCodeDict = data.map((cur) => {
                    return cur.toObject();
                });
            }

            return new Promise((rs, rj) => {
                DepModel.find({}, (err, res) => {
                    if (err) {
                        rj(err);
                    } else {
                        rs(res);
                    }
                })
            })
        }).then(data => {
            if (data && data.length) {
                depDict = data.map((cur) => {
                    return cur.toObject();
                });
            }

            return new Promise((rs, rj) => {
                InsInfoModel.find({}, (err, res) => {
                    if (err) {
                        rj(err);
                    } else {
                        rs(res);
                    }
                })
            })
        }).then(data => {
            if (data && data.length) {
                return co(function* () {
                    let retList = [];
                    for (let cur of data) {
                        let current = cur.toObject();
                        current.periodView = current.period + (function (unit) {
                            switch (unit) {
                                case "days":
                                    return "日";
                                case "months":
                                    return "月";
                                case "weeks":
                                    return "周";
                                case "years":
                                    return "年";
                                default:
                                    return "";
                            }
                        })(current.periodUnit);

                        current.depCodeView = current.depCode;
                        // ((strs) => {
                        //     for (let item of depDict) {
                        //         if (item._id == strs[0]) {
                        //             return item.code;
                        //         }
                        //     }

                        //     return strs[1]
                        // })(current.depCode.split("&"));

                        current.insCodeView = ((strs) => {
                            for (let item of insCodeDict) {
                                if (item._id == strs[0]) {
                                    return item.code;
                                }
                            }

                            return strs[1]
                        })(current.insCode.split("&"));

                        current.endDate = moment(current.endDate).format("YYYY-MM-DD" /*HH:mm:ss*/);
                        current.startDate = moment(current.startDate).format("YYYY-MM-DD" /*HH:mm:ss*/);
                        // current.statusView = current.status;
                        current.statusView = ((status) => {
                            for (let st of statusList) {
                                if (st.statusCode == status) {
                                    return st.label;
                                }
                            }

                            return "";

                        })(current.status);

                        current.testTypeView = (function (type) {
                            let list = [{
                                value: "0",
                                label: "内校"
                            }, {
                                value: "1",
                                label: "外校"
                            }, {
                                value: "2",
                                label: "免校"
                            }];

                            for (let item of list) {
                                if (item.value == type) {
                                    return item.label;
                                }
                            }
                        })(current.testType)

                        if (!!!current.keeper)
                            current.keeperView = ""
                        else
                            current.keeperView = yield composeUser(current.keeper);
                        retList.push(_.assign({}, current, current.extendFields));
                    }

                    return yield exportFile(retList, mainHeaderList.concat(extendHeaderList))
                })

            } else {
                return exportFile([], mainHeaderList.concat(extendHeaderList))
            }
        }).catch(err => {
            console.log("export failed:", err.message);
            console.log(err);
            return {
                success: false,
                message: "导出失败"
            };
        })
    }
}