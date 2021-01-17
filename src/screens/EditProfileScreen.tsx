import { Alert, StyleSheet } from 'react-native'
import RNPickerSelect from 'react-native-picker-select'
import React from 'reactn'
import {
  ActivityIndicator,
  Divider,
  DropdownButtonSelect,
  NavHeaderButtonText,
  Text,
  TextInput,
  View
} from '../components'
import { translate } from '../lib/i18n'
import { alertIfNoNetworkConnection } from '../lib/network'
import { testProps } from '../lib/utility'
import { PV } from '../resources'
import { trackPageView } from '../services/tracking'
import { getAuthUserInfo } from '../state/actions/auth'
import { updateLoggedInUser } from '../state/actions/user'
import { core } from '../styles'

type Props = {
  navigation?: any
}

type State = {
  isLoading?: boolean
  name?: string
  selectedIsPublicKey?: boolean
}

const testIDPrefix = 'edit_profile_screen'

export class EditProfileScreen extends React.Component<Props, State> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: translate('Edit Profile'),
      headerRight: (
        <NavHeaderButtonText
          handlePress={navigation.getParam('updateUser')}
          testID={testIDPrefix}
          text={translate('Save')}
        />
      )
    }
  }

  constructor(props: Props) {
    super(props)
    const user = props.navigation.getParam('user')

    this.state = {
      isLoading: true,
      name: user.name,
      selectedIsPublicKey: user.isPublic
    }
  }

  async componentDidMount() {
    this.props.navigation.setParams({ updateUser: this._updateUser })
    try {
      await getAuthUserInfo()
    } catch (error) {
      //
    }
    this.setState({ isLoading: false })

    trackPageView('/edit-profile', 'Edit Profile Screen')
  }

  _updateUser = async () => {
    const wasAlerted = await alertIfNoNetworkConnection('update your profile')
    if (wasAlerted) return

    this.setState(
      {
        isLoading: true
      },
      async () => {
        try {
          const { name, selectedIsPublicKey } = this.state
          const { id } = this.global.session.userInfo
          await updateLoggedInUser(
            {
              id,
              isPublic: selectedIsPublicKey,
              name
            },
            this.global
          )
          this.props.navigation.goBack(null)
        } catch (error) {
          if (error.response) {
            Alert.alert(
              PV.Alerts.SOMETHING_WENT_WRONG.title,
              PV.Alerts.SOMETHING_WENT_WRONG.message,
              PV.Alerts.BUTTONS.OK
            )
          }
        }
        this.setState({ isLoading: false })
      }
    )
  }

  _ItemSeparatorComponent = () => {
    return <Divider />
  }

  _onChangeIsPublic = (key: boolean) => {
    this.setState({ selectedIsPublicKey: key })
  }

  _onChangeName = (text: string) => {
    this.setState({ name: text })
  }

  render() {
    const user = this.props.navigation.getParam('user')
    const { globalTheme } = this.global
    const { isLoading, name, selectedIsPublicKey } = this.state
    const selectedIsPublicOption = isPublicOptions.find((x) => x.value === selectedIsPublicKey) || selectPlaceholder
    const willBeDifferent = user.isPublic !== selectedIsPublicKey

    let helpText = ''
    if (selectedIsPublicKey) {
      helpText = willBeDifferent
        ? translate('Podcasts clips and playlists will be visible')
        : translate('Podcasts clips and playlists are visible')
    } else {
      helpText = willBeDifferent
        ? translate('Your profile page will be hidden')
        : translate('Your profile page is hidden')
    }

    return (
      <View style={styles.view} {...testProps('edit_profile_screen_view')}>
        {!isLoading ? (
          <View>
            <TextInput
              autoCapitalize='none'
              autoCompleteType='off'
              fontSizeLargestScale={PV.Fonts.largeSizes.md}
              onChangeText={this._onChangeName}
              placeholder={translate('Name')}
              returnKeyType='done'
              style={styles.textInput}
              underlineColorAndroid='transparent'
              testID={`${testIDPrefix}_name`}
              value={name}
            />
            <DropdownButtonSelect
              helpText={helpText}
              items={isPublicOptions}
              label={selectedIsPublicOption.label}
              onValueChange={this._onChangeIsPublic}
              testID={`${testIDPrefix}_picker_select_privacy`}
              value={selectedIsPublicKey}
              wrapperStyle={styles.dropdownButtonSelectWrapper}
            />
          </View>
        ) : (
          <ActivityIndicator fillSpace={true} />
        )}
      </View>
    )
  }
}

const selectPlaceholder = {
  label: translate('Select'),
  value: null
}

const isPublicOptions = [
  {
    label: translate('Public'),
    value: true
  },
  {
    label: translate('Private'),
    value: false
  }
]

const styles = StyleSheet.create({
  dropdownButtonSelectWrapper: {},
  textInput: {},
  textInputSubtext: {
    marginTop: 16
  },
  view: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 16
  }
})
