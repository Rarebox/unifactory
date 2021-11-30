import { useState, useEffect } from 'react'
import { useWeb3React } from '@web3-react/core'
import {
  InputGroup,
  FormControl,
  Form,
  Alert,
  ProgressBar,
  Row,
  Col,
} from 'react-bootstrap'
import { Button } from './Button'
import { deploySwapContracts, deployStorage, isValidAddress } from '../utils'

export function Deployment(props) {
  const { pending, setPending, setError } = props

  const web3React = useWeb3React()
  const [canDeploySwapContract, setCanDeploySwapContract] = useState(false)
  const [canDeployStorage, setCanDeployStorage] = useState(false)
  const [adminAddress, setAdminAddress] = useState('')

  const onAdminChange = (event) => setAdminAddress(event.target.value)

  const [factoryAddress, setFactoryAddress] = useState('')
  const [routerAddress, setRouterAddress] = useState('')
  const [storageAddress, setStorageAddress] = useState('')

  const saveData = (key, value) => {
    const strData = window.localStorage.getItem('userDeploymentData')

    if (strData) {
      const data = JSON.parse(strData)

      data[key] = value

      window.localStorage.setItem('userDeploymentData', JSON.stringify(data))
    } else {
      window.localStorage.setItem(
        'userDeploymentData',
        JSON.stringify({
          [key]: value,
        })
      )
    }
  }

  // TODO: display available info from localStorage
  // const getData = (key) => {
  //   const info = window.localStorage.getItem('userDeploymentData')

  //   if (info) return info[key]
  // }

  const addContractInfo = (name, receipt) => {
    try {
      saveData(`${name}_${receipt.contractAddress}`, receipt.contractAddress)
    } catch (error) {
      setError(error)
    }
  }

  const [deploymentProcessPercent, setDeploymentProcessPercent] =
    useState(false)

  const onSwapDeploy = async () => {
    setPending(true)
    setDeploymentProcessPercent(5)
    setFactoryAddress('')
    setRouterAddress('')

    try {
      const result = await deploySwapContracts({
        library: web3React.library,
        admin: adminAddress,
        onFactoryDeploy: (receipt) => {
          setFactoryAddress(receipt.contractAddress)
          addContractInfo('Factory', receipt)
          setDeploymentProcessPercent(40)
        },
        onRouterDeploy: (receipt) => {
          setRouterAddress(receipt.contractAddress)
          addContractInfo('Router', receipt)
          setDeploymentProcessPercent(90)
        },
      })
    } catch (error) {
      setError(error)
    } finally {
      setPending(false)
      setDeploymentProcessPercent(false)
    }
  }

  const onStorageDeploy = async () => {
    setPending(true)
    setDeploymentProcessPercent(20)
    setStorageAddress('')

    try {
      await deployStorage({
        onDeploy: (receipt) => {
          setStorageAddress(receipt.contractAddress)
          addContractInfo('Storage', receipt)
          setDeploymentProcessPercent(100)
        },
        library: web3React.library,
        admin: adminAddress,
      })
    } catch (error) {
      setError(error)
    } finally {
      setPending(false)
      setDeploymentProcessPercent(false)
    }
  }

  useEffect(() => {
    setCanDeploySwapContract(
      web3React?.active && isValidAddress(web3React.library, adminAddress)
    )

    setCanDeployStorage(
      web3React?.active && isValidAddress(web3React.library, adminAddress)
    )
  }, [web3React.library, adminAddress, web3React?.active])

  return (
    <>
      <section
        className={`mb-4 ${!web3React?.active || pending ? 'disabled' : ''}`}
      >
        <Form.Label htmlFor="adminAddress">Admin address *</Form.Label>
        <InputGroup className="mb-3">
          <FormControl
            defaultValue={adminAddress}
            onChange={onAdminChange}
            id="adminAddress"
          />
        </InputGroup>
      </section>

      <Row>
        <Col className="d-grid">
          <p className="highlightedInfo">
            Main contracts to use swaps, add and remove liquidity
          </p>
        </Col>

        <Col className="d-grid">
          <p className="highlightedInfo">
            Contract for storing project information
          </p>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col className="d-grid">
          <Button
            onClick={onSwapDeploy}
            pending={pending}
            disabled={pending || !canDeploySwapContract}
          >
            Deploy swap contracts
          </Button>
        </Col>

        <Col className="d-grid">
          <Button
            onClick={onStorageDeploy}
            pending={pending}
            disabled={pending || !canDeployStorage}
          >
            Deploy Storage
          </Button>
        </Col>
      </Row>

      {typeof deploymentProcessPercent === 'number' && (
        <ProgressBar
          animated
          now={deploymentProcessPercent}
          className="mb-3"
          variant="success"
        />
      )}

      {factoryAddress && (
        <Alert variant="success">
          <strong>Factory</strong>: {factoryAddress}
        </Alert>
      )}
      {routerAddress && (
        <Alert variant="success">
          <strong>Router</strong>: {routerAddress}
        </Alert>
      )}
      {storageAddress && (
        <Alert variant="success">
          <strong>Storage</strong>: {storageAddress}
        </Alert>
      )}
    </>
  )
}