<template>
  <div class="d-flex justify-space-between align-center px-3 py-2" v-if="account">
    <div>
      <account-selector :accounts="accounts" :account="account" @addNew="openDialog('AddNewAccount')" @import="openDialog('ImportAccount')" @edit="editAccount"></account-selector>
    </div>
    <div class="hex account-address grey--text d-flex align-center">
      <a class="address-link hex" @click="detail.dialog = true">{{shortAddress(account.address)}}</a>
      <copy-btn :text="account.address" icon size="x-small" class="ml-1"><v-icon size="x-small" color="grey">mdi-content-copy</v-icon></copy-btn>
      <v-btn size="x-small" icon style="margin-top:3px;" target="_blank" :href="'https://9cscan.com/address/' + account.address"><v-icon size="x-small" color="grey">mdi-open-in-new</v-icon></v-btn>
    </div>

    <v-dialog v-model="edit.dialog"  theme="dark" scroll-strategy="reposition" dark width="320px">
      <v-card :title="edit.title">
        <template v-slot:text>
          <v-text-field label="Account Name" maxlength="16" @keydown.enter="saveEditingAccount" :rules="requiredRule" v-model="edit.accountName"></v-text-field>
        </template>
        <v-card-actions class="justify-space-between">
          <div>
            <v-btn icon size="small" v-if="edit.account && !edit.account.primary" @click="deleteEditingAccount"><v-icon color="grey">mdi-trash-can-outline</v-icon></v-btn>
          </div>
          <div>
            <v-btn text size="small" @click="edit.dialog = false" :disabled="edit.loading">{{ t('cancel') }}</v-btn>
            <v-btn size="small" color="pointyellow" @click="saveEditingAccount" :loading="edit.loading">{{ t('save') }}</v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="imports.dialog" theme="dark" scroll-strategy="reposition" max-width="320px">
      <v-card :title="t('importPk')">
        <template v-slot:text>
          <div class="mt-4">
            <v-text-field maxlength="16" outlined :rules="requiredRule" dense label="Account Name" v-model="imports.accountName" style="margin-bottom:-10px;"></v-text-field>
            <v-textarea color="pointyellow" :rules="requiredRule" :error-messages="imports.error" class="point-input" filled dense rows="4" label="Private Key" v-model="imports.privateKey"></v-textarea>
          </div>
        </template>
        <v-card-actions class="justify-space-between">
          <div></div>
          <div>
            <v-btn text size="small" @click="imports.dialog = false" :disabled="imports.loading">{{ t('cancel') }}</v-btn>
            <v-btn size="small" color="pointyellow" @click="importAccount" :loading="imports.loading">{{ t('import') }}</v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="detail.dialog" theme="dark" scroll-strategy="reposition" dark max-width="320px">
      <v-card :title="t('accountInfo')">
        <template v-slot:text>
          <div class="mt-4 text-center">
            <div class="text-left pa-3 mb-4" style="background-color: #444;border-radius:8px;">{{account.address}}</div>
            <copy-btn :text="account.address" color="pointyellow" size="small" text-color="white !important" :rounded="false">  
              {{ t('copyAddress') }}
            </copy-btn>
          </div>
        </template>
        <v-card-actions class="justify-space-between">
          <v-btn text color="grey" @click="openPrivateKeyDialog">{{ t('showPk') }}</v-btn>
          <v-btn color="secondary" size="small" @click="detail.dialog = false">{{ t('close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="pkview.dialog" theme="dark" scroll-strategy="reposition" dark width="320px">
      <v-card :title="t('pk')">
        <template v-slot:text>
          <div class="mt-4">
            <div class="description text-left">{{ t('showPkDesc') }}</div>
            <div v-if="!pkview.pk">
              <v-text-field type="password" :error-messages="pkview.error" @keydown.enter="loadPrivateKey" outlined class="mt-4 point-input" color="pointyellow" v-model="pkview.password" dense :label="t('passwordInput')"></v-text-field>
              <v-btn color="pointyellow" class="point-btn" @click="loadPrivateKey" :disabled="!pkview.password" :loading="pkview.loading">{{ t('showPk') }}</v-btn>
            </div>
            <div v-else>
              <div class="text-left pa-3 mb-4 mt-4" style="background-color: #444;border-radius:8px;">
                <span v-if="pkview.hide">********************************************************************************</span>
                <span v-else>{{pkview.pk}}</span>
                <v-btn size="small" icon @click="pkview.hide = !pkview.hide"><v-icon size="small" color="grey">{{pkview.hide ? 'mdi-eye-off-outline':'mdi-eye'}}</v-icon></v-btn>
              </div>
              <copy-btn :text="pkview.pk" color="pointyellow" text-color="white" :rounded="false">
                {{ t('copyPk') }}
              </copy-btn>
            </div>
          </div>
        </template>
        <v-card-actions class="justify-space-between">
          <div></div>
          <v-btn color="secondary" size="small" @click="pkview.dialog = false">{{ t('close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>

import {mapGetters} from "vuex";
import AccountSelector from "@/components/buttons/AccountSelector.vue";
import CopyBtn from "@/components/buttons/CopyBtn.vue";

import rule from "@/utils/rules"
import keccak256 from "keccak256";
import t from "@/utils/i18n"
import utils from "@/utils/utils";

export default {
    name: 'AccountManager',
    components: {
        CopyBtn,
        AccountSelector
    },
    props: [],
    data() {
        return {
            edit: {
                loading: false,
                title: 'Add New',
                dialog: false,
                accountName: ''
            },
            imports: {
                loading: false,
                dialog: false,
                accountName: '',
                privateKey: '',
                error: null
            },
            detail: {
                dialog: false
            },
            pkview: {
                dialog: false,
                password: '',
                pk: null,
                hide: true,
                error: null,
                loading: false
            }
        }
    },
    computed: {
        requiredRule() { return [rule.required] },
        importDialogTitle() { return t('importPk') },
        ...mapGetters('Account', ['accounts', 'account'])
    },
    async created() {
    },
    mounted() {
    },
    methods: {
        t,
        shortAddress: utils.shortAddress,
        openDialog(type) {
            if (type === 'AddNewAccount') {
                this.edit.title = 'Add New'
                this.edit.accountName = 'Account ' + (this.accounts.length + 1)
                this.edit.account = null
                this.edit.dialog = true
            } else if (type === 'ImportAccount') {
                this.imports.accountName = 'Account ' + (this.accounts.length + 1)
                this.imports.privateKey = ''
                this.imports.dialog = true
            }
        },
        editAccount(account) {
            if (account) {
                this.edit.title = 'Account ' + this.shortAddress(account.address)
                this.edit.accountName = account.name
                this.edit.account = account
                this.edit.dialog = true
            }
        },
        async deleteEditingAccount() {
            if (this.edit.account && this.accounts.length > 1) {
                await this.$store.dispatch('Account/deleteAccount', this.edit.account.address)
                this.edit.dialog = false
            }
        },
        async saveEditingAccount() {
            let accountName = this.edit.accountName.trim()
            if (!accountName) return

            this.edit.loading = true
            setTimeout(async () => {
                if (this.edit.account) {
                    await this.$store.dispatch('Account/updateAccountName',
                        {address: this.edit.account.address, name:accountName})
                } else {
                    await this.$store.dispatch('Account/createNewAccount',
                        accountName)
                }
                this.edit.loading = false
                this.edit.dialog = false
            }, 100)
        },


        /**
         * Import Section
         */
        async importAccount() {
            let accountName = this.imports.accountName.trim()
            let pk = this.imports.privateKey.trim()
            if (!accountName || !pk) return

            this.imports.error = null
            this.imports.loading = true

            try {
                await this.$store.dispatch('Account/importAccount', {accountName, privateKey: pk})
                this.imports.dialog = false
            } catch(e) {
                this.imports.error = 'Invalid Private Key'
            }
            this.imports.loading = false
        },

        /**
         * Account Detail & Private Section
         */
        openPrivateKeyDialog() {
            this.pkview.dialog = true
            this.pkview.password = ''
            this.pkview.error = null
            this.pkview.pk = ''
        },
        async loadPrivateKey() {
            if (this.pkview.dialog && this.pkview.password) {
                try {
                    this.pkview.loading = true
                    let passphrase = keccak256(this.pkview.password).toString('hex')
                    let pk = await this.$store.dispatch('Account/getPrivateKey', {
                        address: this.account.address,
                        passphrase: passphrase
                    })
                    this.pkview.pk = pk
                } catch(e) {
                    this.pkview.error = 'Invalid Password'
                }

                this.pkview.loading = false
            }
        }
    }
}
</script>

<style scoped lang="scss">
.address-link {
  color: #888 !important;
}
</style>
