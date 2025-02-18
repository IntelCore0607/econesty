import { h, Component } from 'preact'; // eslint-disable-line no-unused-vars
import { Link, Router } from 'app/components/routing';
import { API } from 'app/api';

import { Button, Grid, GridUnit, Image, Table } from 'app/components/elements';
import { CollectionView, ElementView } from 'app/components/api';
import { Form, FormGroup, Input } from 'app/components/forms';

const dateOpts = { year: 'numeric', month: 'long', day: 'numeric' };
const formatDate = x => new Date(x).toLocaleString(navigator.language, dateOpts);

function BriefUserInfo({ user }) {
  return (
    <span
      className="secondary">
      {user.first_name} {user.last_name} (@{user.username})
    </span>
  );
}

function TransactionCollectionBody({ collectionView }) {
  return (
    <div className="collection">
      <Table striped horizontal>
        <thead>
          <tr><th>#</th><th>Amount</th><th>Sender</th><th>Recipient</th></tr>
        </thead>
        <tbody>
          {collectionView.getElements().map(obj =>
            <tr key={obj.id} onClick={() => Router.push("/transaction/" + obj.id)}> {/* TODO: highlight on hover */}
              <td>
                {obj.id}
              </td>
              <td>
                <span>BTC {parseFloat(obj.amount)}</span>
              </td>
              <td>
                <BriefUserInfo user={obj.sender} />
              </td>
              <td>
                <BriefUserInfo user={obj.recipient} />
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}

function User({ elementView }) {
  if (elementView.getElement().is_me) return <EditableUserRepresentation elementView={elementView} />;
  return <UserRepresentation elementView={elementView} />;
}

function UserRepresentation({ elementView }) {
  let user = elementView.getElement();
  return (
    <div className="user">
      <Image src={user.avatar_url} />
      <div className="primary">{user.first_name || "First Name"} {user.last_name || "Last Name"}</div>
      <div className="tertiary">(@{user.username})</div>
      <div className="secondary">User #{user.id}, since {formatDate(user.date_joined)}</div>
    </div>
  );
}

function EditableUserRepresentation({ elementView }) {
  let user = elementView.getElement();
  return (
    <div className="user editable">
      <Image src={user.avatar_url} />
      <Form aligned onSubmit={elementView.updateElement}>
        <FormGroup>
          <Input name="first_name" value={user.first_name} />
          <Input name="last_name" value={user.last_name} />
        </FormGroup>
        <FormGroup>
          <Input name="username" value={user.username} />
          <Input name="email" value={user.email} />
        </FormGroup>
        <Button action="submit">Save</Button>
      </Form>
      <Link
        component={Button}
        className="margined raised"
        href="/wallets"
      >Wallets</Link>
      <Link
        component={Button}
        className="margined raised"
        href="/required"
      >Required</Link>
      <Button
        onClick={() => {
          API.networking("DELETE", "/token/clear", {}, {}).then(() => {
            API.clearAuth();
            Router.push("/");
          });
        }}
        className="margined raised"
      >LOG OUT</Button>
    </div>
  );
}

function Profile(props) {
  const userId = props.matches.id;

  return (
    <Grid>
      <GridUnit size="1" sm="1-4">
        <ElementView collection={API.user} elementID={userId}>
          <User />
        </ElementView>
      </GridUnit>
      <GridUnit size="1" sm="17-24">
        <div className="profile-button-group">
          <Link
            component={Button}
            className="margined raised"
            href={API.user.baseURL + userId + "/transaction/send"}
          >Send BTC</Link>
          <Link
            component={Button}
            className="margined raised"
            href={API.user.baseURL + userId + "/transaction/receive"}
          >Receive BTC</Link>
        </div>
        <CollectionView collection={API.user.append("/" + userId + "/transactions")}>
          <TransactionCollectionBody />
        </CollectionView>
      </GridUnit>
      <GridUnit size="1" sm="1-24" />
    </Grid>
  );
}

export default Profile;
