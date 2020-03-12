import React, { useMemo, useState, useCallback } from "react"
import styled from "styled-components"
import BigNumber from "bignumber.js"
import { TabNavigation, Tab, Paragraph, TextInput, Button } from "evergreen-ui"
import cERC20Abi from "src/abis/CErc20.json"
import { CDAI_ADDRESS, DAI_ADDRESS } from "src/contracts"
import CPK from "contract-proxy-kit"

interface ICompoundForm {
  web3: any
  address: string
  cpk: CPK
}

type CompoundOperation = "invest" | "withdraw"

const BLOCKS_PER_YEAR = (365.25 * 24 * 3600) / 15
const DECIMALS_18 = 10 ** 18

const SContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 25px;
`

const SMobileLineBreak = styled.br`
  display: none;

  @media screen and (max-width: 768px) {
    display: initial;
  }
`

const formatNumber = (value: number) =>
  new BigNumber(value).div(DECIMALS_18).toFixed(4)

const CompoundForm: React.FC<ICompoundForm> = ({ web3, address, cpk }) => {
  const dai = useMemo(() => new web3.eth.Contract(cERC20Abi, DAI_ADDRESS), [
    web3
  ])
  const cDai = useMemo(() => new web3.eth.Contract(cERC20Abi, CDAI_ADDRESS), [
    web3
  ])
  const [userOperation, setUserOperation] = useState<CompoundOperation>(
    "invest"
  )
  const [cDaiSupplyAPR, setCDaiSupplyAPR] = useState<string>("0")
  const [proxyDaiBalance, setProxyDaiBalance] = useState<number>(0)
  const [daiBalance, setDaiBalance] = useState<number>(0)
  const [cDaiLocked, setCDaiLocked] = useState<number>(0)
  const [daiInputAmount, setDaiInputAmount] = useState<string>("")

  const getData = useCallback(async () => {
    // supplyRate
    const cDaiSupplyRate = await cDai.methods.supplyRatePerBlock().call()
    const res = new BigNumber(cDaiSupplyRate)
      .times(BLOCKS_PER_YEAR)
      .div(DECIMALS_18)
      .times(100)
      .toFixed(2)
    setCDaiSupplyAPR(res)

    // DAI Balance
    const daiBalance = await dai.methods.balanceOf(address).call()
    setDaiBalance(daiBalance)

    // proxy DAI Balance
    const proxyDaiBalance = await dai.methods.balanceOf(cpk.address).call()
    setProxyDaiBalance(proxyDaiBalance)

    // DAI Locked
    const daiLocked = await cDai.methods.balanceOfUnderlying(cpk.address).call()
    setCDaiLocked(daiLocked)
  }, [address, cDai.methods, cpk.address, dai.methods])

  const lockDai = async () => {
    if (!daiInputAmount) {
      return
    }

    const daiAmount = new BigNumber(daiInputAmount)
      .times(DECIMALS_18)
      .toNumber()

    // 1. Fund the proxy

    // 2. Prepare transactions to execute with Contract Proxy Kit

    getData()
  }

  const withdrawDai = async () => {
    if (!daiInputAmount) {
      return
    }

    const daiAmount = new BigNumber(daiInputAmount)
      .times(DECIMALS_18)
      .toString()

    // Prepare transactions to execute with Contract Proxy Kit

    getData()
  }

  React.useEffect(() => {
    getData()
  }, [address, cDai, dai, getData])

  return (
    <SContainer>
      <Paragraph textAlign="left">
        <b>PROXY ADDRESS: </b>
        <SMobileLineBreak />
        {cpk.address}
      </Paragraph>
      <Paragraph textAlign="left">
        <b>PROXY DAI BALANCE: </b>
        {formatNumber(proxyDaiBalance)}
      </Paragraph>
      <Paragraph>
        <b>DAI APR: </b>
        {cDaiSupplyAPR}
      </Paragraph>
      <Paragraph>
        <b>DAI BALANCE: </b>
        {formatNumber(daiBalance)}
      </Paragraph>
      <Paragraph>
        <b>DAI LOCKED: </b>
        {formatNumber(cDaiLocked)}
      </Paragraph>

      <TabNavigation marginTop="20px">
        {["invest", "withdraw"].map(tab => (
          <Tab
            key={tab}
            isSelected={userOperation === tab}
            // @ts-ignore
            onSelect={() => setUserOperation(tab)}
          >
            {tab[0].toUpperCase() + tab.slice(1)}
          </Tab>
        ))}
      </TabNavigation>
      <TextInput
        name="daiAmount"
        placeholder="DAI Amount"
        marginTop="20px"
        value={daiInputAmount}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setDaiInputAmount(event.target.value)
        }}
      />
      <Button
        appearance="primary"
        intent="success"
        marginTop="10px"
        onClick={userOperation === "invest" ? lockDai : withdrawDai}
      >
        {userOperation === "invest" ? "Invest" : "Withdraw"}
      </Button>
    </SContainer>
  )
}

export default CompoundForm
