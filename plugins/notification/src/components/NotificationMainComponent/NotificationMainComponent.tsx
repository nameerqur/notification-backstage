import { Header, Page, HeaderLabel } from '@backstage/core-components';
import { NotificationCenter } from '../NotificationComponent/NotificationComponent';

export const NotificationMainComponent = () => (
  <Page themeId="tool">
    <Header title="Notifications" subtitle="Third-party notifications">
      <HeaderLabel label="Owner" value="Nameer Qureshi" />
    </Header>
    <NotificationCenter />
  </Page>
);
