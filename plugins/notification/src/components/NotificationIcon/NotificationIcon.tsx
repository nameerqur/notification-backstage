import InfoIcon from '@material-ui/icons/Info';
import CheckIcon from '@material-ui/icons/Check';
import WarningIcon from '@material-ui/icons/Warning';
import ErrorIcon from '@material-ui/icons/Error';
import NotificationsActiveIcon from '@material-ui/icons/NotificationsActive';
import { NotificationType } from '../../types/notification';
import { getTypeColor } from '../../utils/notificationUtils';
import { cloneElement, FC, ReactElement } from 'react';

interface NotificationIconProps {
  type: NotificationType;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const ICON_SIZES = {
  small: { fontSize: 16 },
  medium: { fontSize: 24 },
  large: { fontSize: 32 },
} as const;

const getIconComponent = (type: NotificationType): ReactElement => {
  const iconStyle = { color: getTypeColor(type) };

  switch (type) {
    case 'info':
      return <InfoIcon style={iconStyle} />;
    case 'success':
      return <CheckIcon style={iconStyle} />;
    case 'warning':
      return <WarningIcon style={iconStyle} />;
    case 'error':
      return <ErrorIcon style={iconStyle} />;
    case 'general':
    default:
      return <NotificationsActiveIcon style={iconStyle} />;
  }
};

export const NotificationIcon: FC<NotificationIconProps> = ({
  type,
  size = 'medium',
  className,
}) => {
  const iconElement = getIconComponent(type);
  const sizeStyle = ICON_SIZES[size];

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...sizeStyle,
      }}
      aria-label={`${type} notification icon`}
    >
      {cloneElement(iconElement, {
        style: {
          ...iconElement.props.style,
          ...sizeStyle,
        },
      })}
    </span>
  );
};
