/*
 * This is the source code of @SectionTN/OTPTextInput.
 * It is licensed under GNU GPL v. 3.
 * You should have received a copy of the license in this archive (see LICENSE).
 *
 * Copyright Rayen Sbai, 2024-2025.
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type KeyboardTypeOptions,
  type NativeSyntheticEvent,
  TextInput,
  type TextInputKeyPressEventData,
  View,
} from 'react-native';

import lodash from 'lodash';
import { OTPStyles } from './styles';

interface OTPTextInputProps {
  defaultValue?: string;
  inputCount?: number;
  tintColor?: string;
  offTintColor?: string;
  inputMaxLength?: number;
  onTextChangeHandler?: (value: string) => void;
  containerStyle?: object;
  textInputStyle?: object;
  keyboardType?: KeyboardTypeOptions;
  ref?: React.Ref<OTPTextInputHandle>;
  editable?: boolean;
  onFocus?: (index: number) => void;
  onBlur?: (index: number) => void;
  autoFocus?: boolean;
  useNumbersRegex?: boolean;
  useLettersRegex?: boolean;
  useCustomRegex?: boolean;
  customRegex?: RegExp;
}

export interface OTPTextInputHandle {
  clear: () => void;
  setValue: (value: string) => void;
}

/**
 * Custom OTP (One-Time Password) text input component.
 *
 * @template OTPTextInputHandle - The ref object type for the OTPTextInput component.
 * @template OTPTextInputProps - The props type for the OTPTextInput component.
 *
 * @param {OTPTextInputProps} props - The props object for the OTPTextInput component.
 * @param {string} [props.defaultValue=''] - The default value for the OTP input.
 * @param {number} [props.inputCount=4] - The number of OTP input cells.
 * @param {string} [props.tintColor='#3CB371'] - The color of the focused OTP input cell.
 * @param {string} [props.offTintColor='#DCDCDC'] - The color of the non-focused OTP input cells.
 * @param {number} [props.inputMaxLength=1] - The maximum length of each OTP input cell.
 * @param {object} [props.containerStyle={}] - The custom style for the OTP container component.
 * @param {object} [props.textInputStyle={}] - The custom style for the OTP text input component.
 * @param {function} [props.onTextChangeHandler=()=>{}] - The callback function to handle OTP text change.
 * @param {string} [props.keyboardType='numeric'] - The type of keyboard to be displayed.
 * @param {boolean} [props.editable=true] - Determines whether the OTP input is editable.
 *
 * @param {React.Ref} ref - The forward ref for the OTPTextInputHandle.
 *
 * @returns {React.ReactNode} - Returns the JSX code for the OTPTextInput component.
 */
const OTPTextInput = forwardRef<OTPTextInputHandle, OTPTextInputProps>(
  (
    {
      defaultValue = '',
      inputCount = 4,
      tintColor = '#566193',
      offTintColor = '#DADADA',
      inputMaxLength = 1,
      containerStyle = {},
      textInputStyle = {},
      onTextChangeHandler = () => {},
      onBlur = () => {},
      onFocus = () => {},
      keyboardType = 'numeric',
      editable = true,
      autoFocus = true,
      useNumbersRegex = true,
      useCustomRegex = false,
      customRegex = undefined,
    },
    ref
  ) => {
    /**
     *
     */
    if (useNumbersRegex && useCustomRegex) {
      throw new Error(
        'You cannot set both useNumbersRegex and useCustomRegex to true!'
      );
    }

    /**
     * The regular expression used for matching strings based on certain conditions.
     *
     * @type {RegExp}
     *
     * @param {boolean} useNumbersRegex - Determines if only digits should be matched.
     * @param {boolean} useCustomRegex - Determines if a custom regular expression should be used.
     * @param {RegExp} customRegex - The custom regular expression provided by the user.
     *
     * @returns {RegExp} - The regular expression that matches strings based on the given conditions.
     */
    const regex: RegExp = useMemo(() => {
      if (useNumbersRegex) {
        return new RegExp('\\d*'); // Only numbers allowed.
      } else if (useCustomRegex && customRegex) {
        return customRegex; // User supplied regex.
      }

      return new RegExp('.*'); // Default regex (rarely used?) maybe the user doesn't want to use any regex.
    }, [useNumbersRegex, useCustomRegex, customRegex]);

    const [focusedInput, setFocusedInput] = useState(0);
    const [otpText, setOtpText] = useState<string[]>(
      Array.from({ length: inputCount }, (_, i) => defaultValue[i] || '')
    );

    /**
     * Clears the OTP text and sets the focused input to the first input.
     */
    const clear = () => {
      setOtpText(new Array(inputCount).fill(''));
      setFocusedInput(0);
    };
    /**
     * Sets the value of a variable and updates associated states.
     *
     * @param {string} value - The new value to set.
     * @returns {void} - This function does not return anything.
     */
    const setValue = (value: string): void => {
      setOtpText([...value.slice(0, inputCount)]);
      setFocusedInput(inputCount); // Sets focus on the inputCount index
    };

    /**
     *
     */
    useImperativeHandle(ref, () => ({
      clear,
      setValue,
    }));

    const inputsRef = useRef<Array<React.RefObject<TextInput>>>(
      Array.from({ length: inputCount }, () => React.createRef())
    );

    useEffect(() => {
      inputsRef?.current[focusedInput]?.current?.focus();
    }, [focusedInput]);

    /**
     * Variable debounceOnTextChangeHandler is a memoized version of the function onTextChangeHandler
     * with a debounce implemented using lodash.debounce.
     *
     */
    const debounceOnTextChangeHandler = useMemo(
      () => lodash.debounce(onTextChangeHandler, 125),
      [onTextChangeHandler]
    );

    /**
     * Updates the OTP (One-Time Password) value and triggers
     * the corresponding actions.
     *
     * @param {string[]} newOtp An array of strings representing the new OTP value.
     * @returns {void}
     */
    const updateOTP = useCallback(
      (newOtp: string[]) => {
        debounceOnTextChangeHandler(newOtp.join(''));
        setOtpText(newOtp);
      },
      [debounceOnTextChangeHandler]
    );

    /**
     * Callback function triggered when the text in an OTP input cell changes.
     *
     * @param {string} text - The new text value entered the OTP input cell.
     * @param {number} position - The position/index of the OTP input cell.
     * @returns {void}
     */
    const onTextChange = useCallback(
      (text: string, position: number): void => {
        if (!regex.test(text)) {
          return; // Do not update the OTP value if the text does not match the regex
        }
        const newOtp = [...otpText];
        newOtp[position] = text;
        if (text?.length === inputMaxLength && position !== inputCount - 1) {
          setFocusedInput(position + 1);
        }
        updateOTP(newOtp);
      },
      [regex, otpText, inputMaxLength, inputCount, updateOTP]
    );

    /**
     * Callback function for handling key press events on a text input.
     *
     * @param {NativeSyntheticEvent<TextInputKeyPressEventData>} event - The event object containing information about the key press.
     * @param {number} position - The position of the key press within the text input.
     * @returns {void}
     */
    const onKeyPress = useCallback(
      (
        event: NativeSyntheticEvent<TextInputKeyPressEventData>,
        position: number
      ) => {
        const {
          nativeEvent: { key },
        } = event;
        const otpCopy = [...otpText];
        if (key === 'Backspace') {
          if (otpText[position] !== '') {
            otpCopy[position] = '';
          } else if (position > 0) {
            setFocusedInput(position - 1);
          }
          setOtpText(otpCopy);
        }
      },
      [otpText]
    );

    /**
     * Generate the inputs with TextInput components for OTP input.
     * The number of inputs is determined by the `inputCount` variable.
     * Each input has a particular style based on the `OTPStyles.textInput` and `textInputStyle` variables.
     * The border color of each input is set to `tintColor` if it is currently focused, or `offTintColor` otherwise.
     * The value of each input is determined by the corresponding index in the `otpText` array.
     * The maximum length of each input is set to `inputMaxLength`.
     * The autoFocus property is set to true for the first input, and false for the rest.
     * The keyboardType is set to the value of the `keyboardType` variable.
     * The onFocus, onChangeText, and onKeyPress event handlers are set to the provided callback functions.
     * The editable property of each input is determined by the `editable` variable.
     *
     * @returns {Array<React.Component>} An array of TextInput components representing the OTP inputs.
     *
     * @param {number} inputCount - The number of OTP inputs to generate.
     * @param {string} keyboardType - The type of keyboard to use for the inputs.
     * @param {Object} textInputStyle - The custom style object for the inputs.
     * @param {string} tintColor - The color of the border when an input is focused.
     * @param {string} offTintColor - The color of the border when an input is not focused.
     * @param {number} focusedInput - The index of the currently focused input.
     * @param {Array<string>} otpText - An array of strings representing the values of the OTP inputs.
     * @param {number} inputMaxLength - The maximum length of each input cell.
     * @param {boolean} editable - Determines if the inputs are editable.
     * @param {function} onTextChange - The callback function called when the text in an input changes.
     * @param {function} onKeyPress - The callback function called when a key is pressed in an input.
     */
    const generateInputs = useCallback(
      () =>
        Array.from({ length: inputCount }, (_, i) => {
          const inputStyle = [
            OTPStyles.textInput,
            textInputStyle,
            { borderColor: i === focusedInput ? tintColor : offTintColor },
          ];
          return (
            <TextInput
              key={`OTPTextInput_${i}`}
              ref={inputsRef.current[i]}
              autoFocus={autoFocus && i === 0}
              keyboardType={keyboardType}
              style={inputStyle}
              value={otpText[i] || ''}
              maxLength={inputMaxLength}
              onFocus={() => {
                if (onFocus) {
                  onFocus(i);
                }
                setFocusedInput(i);
              }}
              onBlur={() => {
                if (onBlur) {
                  onBlur(i);
                }
              }}
              onChangeText={(text) => onTextChange(text, i)}
              onKeyPress={(event) => onKeyPress(event, i)}
              editable={editable}
            />
          );
        }),
      [
        inputCount,
        textInputStyle,
        focusedInput,
        tintColor,
        offTintColor,
        autoFocus,
        keyboardType,
        otpText,
        inputMaxLength,
        editable,
        onFocus,
        onBlur,
        onTextChange,
        onKeyPress,
      ]
    );

    return (
      <View style={[OTPStyles.container, containerStyle]}>
        {generateInputs()}
      </View>
    );
  }
);

export default OTPTextInput;
