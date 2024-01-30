// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import "./PopupModal.css";
import Modal from "./Modal"
const initialNewsletterModalData = {
    cutoff: '50',
    sex: '', // For binary edgeType
    comparisonOperator: '',
    step: 1,
};

const PopupModal = ({ onSubmit, isOpen, onClose, edgeType, dataRange}) => {
    const key = dataRange ? Object.keys(dataRange)[0] : "";
    const rangeArray = dataRange ? dataRange[key] : [0, 100];
    const middle = dataRange ? ((rangeArray[0] + rangeArray[1]) / 2).toString()
        : ((rangeArray[0] + rangeArray[1]) / 2).toString()
    const step = key === "30m" ? 0.01 : 1;
    const focusInputRef = useRef(null);
    const [formState, setFormState] = useState(initialNewsletterModalData);
    const [sliderValue, setSliderValue] = useState(initialNewsletterModalData.cutoff);
    useEffect(() => {
        // Only update the slider value when the middle value changes
        setFormState((prevFormData) => ({
            ...prevFormData,
            cutoff: middle,
            step: step,
        }));
        setSliderValue(middle);
    }, [middle, step]);

    useEffect(() => {
        if (isOpen && focusInputRef.current) {
            setTimeout(() => {
                focusInputRef.current.focus();
            }, 1);
        }
    }, [isOpen]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setSliderValue(value);

        // For binary edgeType, update selectedOption
        if (name === 'sex') {
            setFormState((prevFormData) => ({
                ...prevFormData,
                sex: value,
            }));
        } else if (name === 'comparisonOperator') {
            // Update selected comparison operator
            setFormState((prevFormData) => ({
                ...prevFormData,
                comparisonOperator: value,
            }));
        } else {
            setFormState((prevFormData) => ({
                ...prevFormData,
                [name]: value,
            }));
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(formState);
        setFormState(initialNewsletterModalData);
    };

    return (
        <Modal hasCloseBtn={true} isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <div className="form-row"></div>
                {edgeType === 'binary' ? (
                    <div className="form-row">
                        <label>Choose an option:</label>
                        <label>
                            <input
                                type="radio"
                                name="sex"
                                value="male"
                                checked={formState.sex === 'male'}
                                onChange={handleInputChange}
                            />
                            male
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="sex"
                                value="female"
                                checked={formState.sex === 'female'}
                                onChange={handleInputChange}
                            />
                            female
                        </label>
                    </div>
                ) : (
                    <div className="form-row">
                        <label htmlFor="cutoff">{dataRange ? Object.keys(dataRange)[0] : 'cutoff'}</label>
                        <input
                            ref={focusInputRef}
                            type="range"
                            id="cutoff"
                            name="cutoff"
                            value={formState.cutoff}
                            min={rangeArray[0]}
                            max={rangeArray[1]}
                            step={formState.step}
                            onChange={handleInputChange}
                            required
                        />
                        <span>{sliderValue}</span>
                    </div>
                )}
                {edgeType !== 'binary' && (
                <div className="form-row">
                    <label>Choose a comparison operator:</label>
                    <label>
                        <input
                            type="radio"
                            name="comparisonOperator"
                            value="="
                            checked={formState.comparisonOperator === '='}
                            onChange={handleInputChange}
                        />
                        {'='}
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="comparisonOperator"
                            value="!="
                            checked={formState.comparisonOperator === '!='}
                            onChange={handleInputChange}
                        />
                        {'!='}
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="comparisonOperator"
                            value="<"
                            checked={formState.comparisonOperator === '<'}
                            onChange={handleInputChange}
                        />
                        {'<'}
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="comparisonOperator"
                            value=">"
                            checked={formState.comparisonOperator === '>'}
                            onChange={handleInputChange}
                        />
                        {'>'}
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="comparisonOperator"
                            value="<="
                            checked={formState.comparisonOperator === '<='}
                            onChange={handleInputChange}
                        />
                        {'<='}
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="comparisonOperator"
                            value=">="
                            checked={formState.comparisonOperator === '>='}
                            onChange={handleInputChange}
                        />
                        {'>='}
                    </label>
                </div>
                )}
                <div className="form-row">
                    <button type="submit" disabled={edgeType === 'range' && !formState.comparisonOperator}>Submit</button>
                </div>
            </form>
        </Modal>
    );
};

export default PopupModal;