import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import SelectDropdown from 'react-native-select-dropdown' // Import the dropdown component
import tw from 'twrnc'

const HelpCreate = () => {
  const [priority, setPriority] = useState('Normal') // ComboBox State
  const [helpText, setHelpText] = useState('') // TextInput (TextArea) State

  const maxLength = 5000

  // Calculate remaining character count
  const remainingCount = maxLength - helpText.length

  const handleSave = () => {
    // Logic for saving help goes here
    console.log("Help Saved:", { priority, helpText })
  }

  const priorityOptions = ['Normal', 'Top Urgent', 'Extremely Urgent']

  return (
    <View style={tw`p-6 bg-gray-50 rounded-xl shadow-lg`}>
      {/* Header Text */}
      <Text style={tw`text-2xl font-semibold text-gray-800 mb-6`}>
        Create Help Request
      </Text>

      {/* Priority Dropdown */}
      <Text style={tw`text-lg font-medium text-gray-700 mb-3`}>Select Priority</Text>
      <View style={tw`border border-gray-300 rounded-lg p-3 mb-6`}>
        <SelectDropdown
          data={priorityOptions} // Data for the dropdown
          onSelect={(selectedItem) => setPriority(selectedItem)} // Handle selection
          defaultValue={priority} // Default selected value
          buttonTextAfterSelection={(selectedItem) => selectedItem} // Text after selection
          rowTextForSelection={(item) => item} // Text for the dropdown items
          buttonStyle={tw`w-full bg-white border border-gray-300 rounded-lg p-3`} // Style for the button
          buttonTextStyle={tw`text-lg text-gray-800`} // Style for button text
          dropdownStyle={tw`border border-gray-300 rounded-lg`} // Style for the dropdown
          rowStyle={tw`bg-white p-3`} // Style for dropdown items
          rowTextStyle={tw`text-lg text-gray-700`} // Style for dropdown item text
        />
      </View>

      {/* Help Description */}
      <Text style={tw`text-lg font-medium text-gray-700 mb-3`}>Help Description</Text>
      <TextInput
        style={tw`border border-gray-300 rounded-lg p-4 h-48 text-base bg-white text-gray-800 mb-2 shadow-md`}
        multiline
        maxLength={maxLength}
        value={helpText}
        onChangeText={setHelpText}
        placeholder="Enter your help description (max 5000 characters)"
      />

      {/* Character count */}
      <Text style={tw`text-sm text-gray-500`}>
        {remainingCount} characters remaining
      </Text>

      {/* Save Button */}
      <TouchableOpacity
        onPress={handleSave}
        style={tw`bg-gradient-to-r from-yellow-500 to-yellow-600 py-3 px-6 rounded-full mt-6 shadow-md`}
      >
        <Text style={tw`text-white text-lg font-semibold text-center`}>Create Help</Text>
      </TouchableOpacity>
    </View>
  )
}

export default HelpCreate
