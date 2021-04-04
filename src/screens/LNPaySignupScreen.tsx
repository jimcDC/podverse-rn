import { Linking, StyleSheet, Alert } from 'react-native'
import React from 'reactn'
import { createWallet, getWallet } from '../services/lnpay'
import { Button, Divider, ScrollView, Text, TextInput, View } from '../components'
import { translate } from '../lib/i18n'
import { testProps } from '../lib/utility'
import { PV } from '../resources'
import { trackPageView } from '../services/tracking'
import { LNWallet, saveLNPayWallet, toggleLNPayFeature } from '../state/actions/lnpay'

type Props = any

type State = {
  apiKey: string
  walletName: string
  walletKey: string
  walletId: string
}

export class LNPaySignupScreen extends React.Component<Props, State> {
  constructor() {
    super()
    this.state = {
      apiKey: '',
      walletName: '',
      walletKey: '',
      walletId: ''
    }
  }

  static navigationOptions = () => ({
    title: translate('LNPay Signup').toUpperCase()
  })

  componentDidMount() {
    trackPageView('/lnpaysignup', 'LN Pay Signup')
  }

  _attemptCreateWallet = async () => {
    try {
      let newWallet = null
      if (this.state.apiKey) {
        if (this.state.walletId) {
          const potentialWallet: LNWallet = {
            id: this.state.walletId,
            publicKey: this.state.apiKey,
            access_keys: {
              'Wallet Admin': [this.state.walletKey]
            }
          }
          const existingWallet = await getWallet(potentialWallet)
          if (existingWallet) {
            newWallet = existingWallet
          }
        } else {
          newWallet = await createWallet(this.state.apiKey, this.state.walletName)
        }

        if (newWallet) {
          await saveLNPayWallet({
            id: newWallet.id,
            publicKey: this.state.apiKey,
            access_keys: newWallet.access_keys
          })

          await toggleLNPayFeature(true)
          this.props.navigation.goBack()
        } else {
          throw new Error(
            'Wallet could not be saved locally. Please make sure the information you entered is correct and try again.'
          )
        }
      }
    } catch (err) {
      Alert.alert('LNPay Error', err.message)
    }
  }

  render() {
    const instructions = [
      translate('LNPayDescriptionText1'),
      translate('LNPayDescriptionText2'),
      translate('LNPayDescriptionText3')
    ]

    return (
      <View style={styles.content} {...testProps('lnpay_signup_screen_view')}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Text fontSizeLargestScale={PV.Fonts.largeSizes.md} style={styles.text}>
            {instructions[0]}
            <Text
              onPress={() => Linking.openURL(PV.URLs.lnpay.DeveloperDashboardUrl)}
              style={this.global.globalTheme.link}>
              {PV.URLs.lnpay.DeveloperDashboardUrl}
            </Text>
          </Text>
          <Text fontSizeLargestScale={PV.Fonts.largeSizes.md} style={styles.text}>
            {'\n'}
            {instructions[1]}
          </Text>
          <Divider style={styles.divider} />
          <TextInput
            testID='ln_public_api_button'
            value={this.state.apiKey}
            onChangeText={(newText: string) => this.setState({ apiKey: newText })}
            wrapperStyle={{ marginTop: 0 }}
            placeholder={translate('Public API Key')}
            eyebrowTitle={translate('Public API Key')}
          />
          {!this.state.walletId && (
            <TextInput
              testID='create_wallet_name_input'
              value={this.state.walletName}
              onChangeText={(newText: string) => this.setState({ walletName: newText })}
              wrapperStyle={{ marginTop: 10 }}
              placeholder={translate('Wallet Name (Optional)')}
              eyebrowTitle={translate('Wallet Name (Optional)')}
            />
          )}
          <Divider style={styles.divider} />
          <TextInput
            testID='import_wallet_id_input'
            value={this.state.walletId}
            onChangeText={(newText: string) => this.setState({ walletId: newText })}
            wrapperStyle={{ marginTop: 0 }}
            placeholder={translate('Wallet ID (For An Existing Wallet)')}
            eyebrowTitle={'Wallet Id'}
          />
          {!!this.state.walletId && (
            <TextInput
              testID='import_wallet_key_input'
              value={this.state.walletKey}
              onChangeText={(newText: string) => this.setState({ walletKey: newText })}
              wrapperStyle={{ marginTop: 10 }}
              placeholder={translate('Wallet Admin Key')}
              eyebrowTitle={translate('Wallet Admin Key')}
            />
          )}

          <Button
            testID='create_wallet_button'
            disabled={!this.state.apiKey || (!!this.state.walletId && !this.state.walletKey)}
            text={translate('Add Wallet')}
            wrapperStyles={{ marginBottom: 20 }}
            onPress={this._attemptCreateWallet}
          />
          <Text fontSizeLargestScale={PV.Fonts.largeSizes.md} style={styles.text}>
            {translate(`Disclaimer:`)}
            {'\n\n'}
            {instructions[2]}
          </Text>
          <Divider style={styles.divider} />
        </ScrollView>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  content: {
    flex: 1
  },
  copyLeftSymbol: {
    flex: 0,
    fontSize: PV.Fonts.sizes.xl,
    fontWeight: PV.Fonts.weights.bold,
    marginLeft: 8,
    transform: [{ rotateY: '180deg' }]
  },
  copyLeftText: {
    flex: 0,
    fontSize: PV.Fonts.sizes.xl
  },
  copyLeftWrapper: {
    flexDirection: 'row',
    marginBottom: 15
  },
  divider: {
    marginVertical: 20
  },
  scrollViewContent: {
    padding: 15
  },
  sectionTitle: {
    marginBottom: 15,
    fontSize: PV.Fonts.sizes.xl,
    fontWeight: PV.Fonts.weights.bold
  },
  text: {
    fontSize: PV.Fonts.sizes.md
  }
})
