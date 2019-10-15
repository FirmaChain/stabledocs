import {
    api_get_subscribe_plan,
    api_get_current_subscription,
    api_get_current_onetime_ticket,
    api_get_current_total_ticket,
    api_input_payment_info,
    api_get_payment_info,
    api_make_monthly_commitment,
    api_reserve_monthly_commitment,
    api_terminate_monthly_commitment,
    api_buy_onetime_ticket,
    api_increase_account,
    api_get_payment_log,
    api_get_current_subscription_payment,
    api_get_maximum_member_count,
    api_check_ticket_count,
    api_get_next_subscription_payment,
    api_get_ticket_log,
} from "../../../gen_api"

export function get_subscribe_plan(){
    return async function(){
        return (await api_get_subscribe_plan())
    };
}

export function get_current_subscription(){
    return async function(){
        return (await api_get_current_subscription())
    };
}

export function get_current_onetime_ticket(){
    return async function(){
        return (await api_get_current_onetime_ticket())
    };
}

export function get_current_total_ticket(){
    return async function(){
        return (await api_get_current_total_ticket())
    };
}

export function input_payment_info(data, preview_data){
    return async function(){
        return (await api_input_payment_info(JSON.stringify(data), JSON.stringify(preview_data) ));
    };
}

export function get_payment_info(){
    return async function(){
        return (await api_get_payment_info())
    };
}

export function get_payment_log(page = 0, display_count = 6){
    return async function(){
        return (await api_get_payment_log(page, display_count))
    };
}

export function get_ticket_log(page = 0, display_count = 6 ) {
    return async function() {
        return (await api_get_ticket_log(page, display_count))
    }
}

export function make_monthly_commitment(plan_id) {
    return async function(){
        return (await api_make_monthly_commitment(plan_id))
    };
}

export function reserve_monthly_commitment(plan_id) {
    return async function(){
        return (await api_reserve_monthly_commitment(plan_id))
    };
}

export function terminate_monthly_commitment() {
    return async function(){
        return (await api_terminate_monthly_commitment())
    };
}

export function buy_onetime_ticket(plan_id, count) {
    return async function(){
        return (await api_buy_onetime_ticket(plan_id, count))
    };
}

export function get_next_subscription_payment() {
    return async function() {
        return (await api_get_next_subscription_payment())
    }
}

export function increase_account(account_count){
    return async function(){
        return (await api_increase_account(account_count));
    };
}

export function get_current_subscription_payment(){
    return async function(){
        return (await api_get_current_subscription_payment());
    };
}

export function get_maximum_member_count(){
    return async function(){
        return (await api_get_maximum_member_count());
    };
}

export function check_ticket_count(){
    return async function(){
        return (await api_check_ticket_count());
    };
}

