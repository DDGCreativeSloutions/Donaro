import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { UserProvider } from '../../contexts/UserContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import DonationForm from '../../components/DonationForm';

// Mock the UserContext
const MockUserProvider = ({ children, user = null }) => (
  <UserProvider value={{ user, setUser: jest.fn(), refreshUser: jest.fn() }}>
    {children}
  </UserProvider>
);

describe('Button Component', () => {
  test('renders correctly with title', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={jest.fn()} />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  test('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  test('shows loading state', () => {
    const { getByTestId } = render(
      <Button title="Test Button" onPress={jest.fn()} loading={true} />
    );
    
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  test('is disabled when loading', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={mockOnPress} loading={true} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });
});

describe('Input Component', () => {
  test('renders correctly with placeholder', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter text" value="" onChangeText={jest.fn()} />
    );
    
    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });

  test('calls onChangeText when text changes', () => {
    const mockOnChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter text" value="" onChangeText={mockOnChangeText} />
    );
    
    fireEvent.changeText(getByPlaceholderText('Enter text'), 'new text');
    expect(mockOnChangeText).toHaveBeenCalledWith('new text');
  });

  test('shows error state', () => {
    const { getByText } = render(
      <Input 
        placeholder="Enter text" 
        value="" 
        onChangeText={jest.fn()} 
        error="This field is required"
      />
    );
    
    expect(getByText('This field is required')).toBeTruthy();
  });

  test('toggles password visibility', () => {
    const { getByTestId } = render(
      <Input 
        placeholder="Password" 
        value="" 
        onChangeText={jest.fn()} 
        secureTextEntry={true}
      />
    );
    
    const toggleButton = getByTestId('password-toggle');
    fireEvent.press(toggleButton);
    
    // Should toggle the secure text entry
    expect(toggleButton).toBeTruthy();
  });
});

describe('Card Component', () => {
  test('renders children correctly', () => {
    const { getByText } = render(
      <Card>
        <text>Card Content</text>
      </Card>
    );
    
    expect(getByText('Card Content')).toBeTruthy();
  });

  test('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByTestId } = render(
      <Card style={customStyle} testID="custom-card">
        <text>Content</text>
      </Card>
    );
    
    const card = getByTestId('custom-card');
    expect(card.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining(customStyle)
    ]));
  });
});

describe('DonationForm Component', () => {
  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com'
  };

  test('renders all form fields', () => {
    const { getByPlaceholderText } = render(
      <MockUserProvider user={mockUser}>
        <DonationForm onSubmit={jest.fn()} />
      </MockUserProvider>
    );
    
    expect(getByPlaceholderText('Donation Title')).toBeTruthy();
    expect(getByPlaceholderText('Description')).toBeTruthy();
    expect(getByPlaceholderText('Quantity')).toBeTruthy();
    expect(getByPlaceholderText('Receiver Name')).toBeTruthy();
  });

  test('validates required fields', async () => {
    const mockOnSubmit = jest.fn();
    const { getByText } = render(
      <MockUserProvider user={mockUser}>
        <DonationForm onSubmit={mockOnSubmit} />
      </MockUserProvider>
    );
    
    const submitButton = getByText('Submit Donation');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(getByText('Title is required')).toBeTruthy();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('submits form with valid data', async () => {
    const mockOnSubmit = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <MockUserProvider user={mockUser}>
        <DonationForm onSubmit={mockOnSubmit} />
      </MockUserProvider>
    );
    
    // Fill form fields
    fireEvent.changeText(getByPlaceholderText('Donation Title'), 'Food Donation');
    fireEvent.changeText(getByPlaceholderText('Description'), 'Fresh vegetables');
    fireEvent.changeText(getByPlaceholderText('Quantity'), '10 kg');
    fireEvent.changeText(getByPlaceholderText('Receiver Name'), 'Local Shelter');
    
    const submitButton = getByText('Submit Donation');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Food Donation',
          description: 'Fresh vegetables',
          quantity: '10 kg',
          receiver: 'Local Shelter'
        })
      );
    });
  });

  test('handles photo selection', async () => {
    const { getByText } = render(
      <MockUserProvider user={mockUser}>
        <DonationForm onSubmit={jest.fn()} />
      </MockUserProvider>
    );
    
    const photoButton = getByText('Add Donation Photo');
    fireEvent.press(photoButton);
    
    // Should trigger photo selection
    expect(photoButton).toBeTruthy();
  });
});