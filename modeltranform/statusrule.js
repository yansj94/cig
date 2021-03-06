/*
1、receive:  待召回待校验仪器（中间）
2、normal：正常使用中的仪器
3、test: 已召回待校验的仪器（中间）
4、pause: 暂停使用的仪器
5、remove: 转售、退运等纳入移除类仪器
6、limit：部分功能失效的仪器
7、diagnose: 异常单已发出待召回（中间）
8、send out:  已校验完毕待取件(取消)
9、NT: 免校验类仪器
10、 sending : 外送中
 */
module.exports = {
    completeStatus: [
        "2", "4", "5", "6", "9", "12", '13', "14"
    ],
    statusRule: [
        "2=>1",
        "1=>3",
        "3=>8",
        "8=>2",
        "1=>7",
        "7=>4",
        "7=>5",
        "7=>6",
        "7=>9",
        "7=>8",
        "7=>12",
        "7=>13",
        "7=>14",
        "3=>10",
        "3=>7",
        "10=>8",
        "10=>11",
        "11=>4",
        "11=>5",
        "11=>6",
        "11=>7",
        "11=>8",
        "11=>9",
        "11=>10",
    ],
    statusList: [{
        statusCode: "1",
        label: "待召回"
    }, {
        statusCode: "2",
        label: "正常使用"
    }, {
        statusCode: "3",
        label: "待校验"
    }, {
        statusCode: "4",
        label: "暂停使用"
    }, {
        statusCode: "5",
        label: "移除类"
    }, {
        statusCode: "6",
        label: "功能失效"
    }, {
        statusCode: "7",
        label: "异常（待召回）"
    }, {
        statusCode: "8",
        label: "校验完毕"
    }, {
        statusCode: "9",
        label: "免检仪器"
    }, {
        statusCode: "10",
        label: "外送中"
    }, {
        statusCode: "11",
        label: "外校已返厂"
    }, {
        statusCode: "12",
        label: "遗失"
    }, {
        statusCode: "13",
        label: "送修中"
    }, {
        statusCode: "14",
        label: "待维修"
    }, {
        statusCode: "15",
        label: "限制使用"
    }],
    statusCode: {
        receive: "1",
        normal: "2",
        test: "3",
        pause: "4",
        remove: "5",
        limit: "6",
        diagnose: "7",
        sendOut: "8",
        nt: "9",
        sending: "10",
        outback: "11",
        lost: "12",
        sendfix: "13",
        waitfix: "14",
        limituse: "15",
    },
    statusCodeView: {
        "1": "receive",
        "2": "normal",
        "3": "test",
        "4": "pause",
        "5": "remove",
        "6": "limit",
        "7": "diagnose",
        "8": "sendOut",
        "9": "nt",
        "10": "sending",
        "11": "outback",
        "12": "lost",
        "13": "sendfix",
        "14": "waitfix",
        "15": "limituse",
    },
    needProve: [
        "3=>8",
        "7=>4",
        "7=>5",
        "7=>6",
        "7=>8",
        "7=>9",
        "10=>8",
    ],
    exportHeaderOrder: [
        { index: "序号" },
        { org: "所属方" },
        { insCodeView: "代码" },
        { name: "设备名称" },
        { modelNo: '型号' },
        { code: '仪器编号' },
        { specification: '规格' },
        { periodView: '周期' },
        { startDate: '校验日期' },
        { endDate: '到校日期' },
        { testTypeView: '校验类型' },
        { keeperView: '保管人' },
        // : 3,
        { owner: "设备负责人" },
        { depCode: "部门代码" },
        { description: "描述" },
        { No: "序列号" },
        { statusView: "仪器状态" },
        { assertNo: '资产编号' },
    ],
    importHeaderOrder: {
        insCode: 2,
        name: 3,
        modelNo: 4,
        code: 5,
        specification: 6,
        period: 7,
        startDate: 8,
        endDate: 9,
        testType: 10,
        keeper: 11,
        owner: 12,
        depCode: 13,
        description: 14,
        No: 15,
        status: 16,
        assertNo: 17,
    },
    authList: [{
        name: "用户信息",
        code: "00001"
    }, {
        name: "仪器信息",
        code: "00002"
    }, {
        name: "科室信息",
        code: "00003"
    }, {
        name: "仪器代码",
        code: "00004"
    }, {
        name: "仪器列表",
        code: "00006"
    }, {
        name: "计量管理员",
        code: "00008"
    }, {
        name: "菜单设置",
        code: "00009"
    }, {
        name: "字典编辑(管理员)",
        code: "00007"
    }, {
        name: "超级管理员",
        code: "00000"
    }]
}