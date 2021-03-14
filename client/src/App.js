import React, { Component } from "react";
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import SlotFactoryContract from "./contracts/SlotFactory.json";
import SlotManagementContract from "./contracts/SlotManagement.json";
import SlotUpgradeContract from "./contracts/SlotUpgrade.json";
import getWeb3 from "./getWeb3";
import { Layout, Table, Button } from 'antd';
import { BuildOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';

import "./App.css";

const { Header, Content, Footer } = Layout;

class App extends Component {
  state = {
    web3: null,
    accounts: null,
    contracts: {
      factory: null,
      management: null,
      upgrade: null
    },
    slots: null,
    createFarmButtonDisabled: false,
    selectedItem: null
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();

      const slotFactoryNetwork = SlotFactoryContract.networks[networkId];
      const slotFactoryInstance = new web3.eth.Contract(
        SlotFactoryContract.abi,
        slotFactoryNetwork && slotFactoryNetwork.address
      );

      const slotManagementNetwork = SlotManagementContract.networks[networkId];
      const slotManagementInstance = new web3.eth.Contract(
        SlotManagementContract.abi,
        slotManagementNetwork && slotManagementNetwork.address
      )

      const slotUpgradeNetwork = SlotUpgradeContract.networks[networkId];
      const slotUpgradeInstance = new web3.eth.Contract(
        SlotUpgradeContract.abi,
        slotUpgradeNetwork && slotUpgradeNetwork.address
      )

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contracts: {
        factory: slotFactoryInstance,
        management: slotManagementInstance,
        upgrade: slotUpgradeInstance
      }}, this.getFactory);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  getFactory = async () => {
    console.log("get factory")
    const { accounts, contracts } = this.state;

    var tmp = await contracts.factory.methods.getFarmByOwner(accounts[0]).call({from: accounts[0]});
    var results = []
    for (var i in tmp) {
      var tmpInt = parseInt(i);
      var tmp1 = await contracts.factory.methods.slots(tmpInt).call({from: accounts[0]});
      tmp1.key = tmpInt;
      results.push(tmp1);
    }

    this.setState({ slots: results });
  };

  onRowCallback = (record) => {
    return {
      onClick: event => {
        this.setState({ selectedItem: record });
      },
    };
  }

  createFarmButton = () => {
    console.log("create farm button")
    if (this.state.slots != null && this.state.slots.length == 0) {
      return <Button disabled={this.state.createFarmButtonDisabled} onClick={(event) => {
        const { accounts, contracts } = this.state;
        this.setState({createFarmButtonDisabled: true});
        contracts.factory.methods.createFarm().send({ from: accounts[0] });
        setTimeout(this.getFactory, 5000);
      }}>Create Farm</Button>
    }
  }

  render() {
    var itemList = this.state.slots;
    var cols = [
      {title: "crop ID", dataIndex: "cropID"},
      {title: "level", dataIndex: "level"},
      {title: "price", dataIndex: "price"}
    ]

    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <Layout className="layout" style={{ minWidth:"500px" }}>
        <Header style={{ color:"white", whiteSpace:"nowrap" }}>
          <BuildOutlined style={{ color:"white", fontSize:"200%", paddingInline: '0 25px'  }} />
          Account ID: {this.state.accounts[0]}
        </Header>
        <Content style={{ padding: '0 50px' }}>
          <div className="site-layout-content">
          <Table onRow={this.onRowCallback} 
            dataSource={itemList} 
            columns={cols} 
            pagination={false} 
            showHeader={true} 
            style={{cursor:"pointer"}} 
            bordered={true}
            rowSelection={{
              type: "radio",
              selectedRowKeys: this.state.selectedItem == null ? [] : [this.state.selectedItem.key]
            }}
          />
            selected item: {this.state.selectedItem == null ? "" : this.state.selectedItem.key}
          </div>
          {this.createFarmButton()}
        </Content>
        <Footer style={{ textAlign: 'center' }}>CSC2125 DApp</Footer>
      </Layout>
    );
  }
}

export default App;
